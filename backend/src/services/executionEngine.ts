import { prisma } from '../prisma/client';
import { executeProxyRequest } from './proxyService';
import { evaluateAllAssertions, AssertionDefinition } from './assertionEvaluator';

export interface ExecutionOptions {
  projectId: string;
  suiteId?: string;
  testCaseIds?: string[];
  environmentName?: string;
  triggeredBy?: string;
}

/**
 * Replaces `{{variable}}` templates with values from environment variables
 */
export function interpolateVariables(
  template: string | null | undefined,
  variables: Record<string, string>
): string {
  if (!template) return '';
  return template.replace(/\{\{\s*([\w.-]+)\s*\}\}/g, (match, varName) => {
    return varName in variables ? variables[varName] : match;
  });
}

/**
 * Executes a single test case against its environment
 */
export async function executeSingleTestCase(
  testCaseId: string,
  testRunId: string,
  envVars: Record<string, string>,
  defaultBaseUrl: string = 'http://localhost:5001'
) {
  const testCase = await prisma.testCase.findUnique({
    where: { id: testCaseId },
    include: { assertions: true, endpoint: true },
  });

  if (!testCase) {
    throw new Error(`Test Case with ID '${testCaseId}' not found.`);
  }

  // Determine base target URL
  const baseUrl = envVars['baseUrl'] || defaultBaseUrl;
  let fullPath = testCase.path;

  // If path doesn't start with http, prepend baseUrl
  if (!fullPath.startsWith('http://') && !fullPath.startsWith('https://')) {
    const cleanBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    const cleanPath = fullPath.startsWith('/') ? fullPath : `/${fullPath}`;
    fullPath = `${cleanBase}${cleanPath}`;
  }

  // Interpolate variables into URL
  const interpolatedUrl = interpolateVariables(fullPath, envVars);

  // Parse and interpolate headers
  let headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (testCase.headers) {
    try {
      const parsed = typeof testCase.headers === 'string'
        ? JSON.parse(testCase.headers)
        : testCase.headers;
      for (const [k, v] of Object.entries(parsed)) {
        headers[k] = interpolateVariables(String(v), envVars);
      }
    } catch {
      // Keep defaults if parse fails
    }
  }

  // Parse and interpolate Query Params
  let params: Record<string, any> | undefined;
  if (testCase.queryParams) {
    try {
      const parsed = typeof testCase.queryParams === 'string'
        ? JSON.parse(testCase.queryParams)
        : testCase.queryParams;
      params = {};
      for (const [k, v] of Object.entries(parsed)) {
        params[k] = interpolateVariables(String(v), envVars);
      }
    } catch {
      params = undefined;
    }
  }

  // Parse and interpolate Body
  let bodyData: any = undefined;
  if (testCase.body && testCase.method !== 'GET' && testCase.method !== 'HEAD') {
    const interpolatedBodyStr = interpolateVariables(testCase.body, envVars);
    try {
      bodyData = JSON.parse(interpolatedBodyStr);
    } catch {
      bodyData = interpolatedBodyStr;
    }
  }

  // Auth Handling
  if (testCase.authType === 'bearer' && testCase.authConfig) {
    try {
      const auth = JSON.parse(testCase.authConfig);
      const token = interpolateVariables(auth.token || '', envVars);
      if (token) headers['Authorization'] = `Bearer ${token}`;
    } catch {}
  } else if (testCase.authType === 'apiKey' && testCase.authConfig) {
    try {
      const auth = JSON.parse(testCase.authConfig);
      const key = auth.key || 'x-api-key';
      const val = interpolateVariables(auth.value || '', envVars);
      if (auth.addTo === 'query') {
        params = params || {};
        params[key] = val;
      } else {
        headers[key] = val;
      }
    } catch {}
  }

  // Execute request via proxy
  const proxyResult = await executeProxyRequest({
    method: testCase.method,
    url: interpolatedUrl,
    headers,
    params,
    data: bodyData,
    timeoutMs: 10000,
    allowLocalDemo: true,
  });

  // Evaluate assertions
  const assertionDefinitions: AssertionDefinition[] = testCase.assertions.map((a) => ({
    id: a.id,
    type: a.type as any,
    target: a.target,
    operator: a.operator as any,
    expectedValue: interpolateVariables(a.expectedValue, envVars),
  }));

  // If expected status code is set and not already in assertions, add it as primary assertion
  const hasStatusAssertion = assertionDefinitions.some((a) => a.type === 'STATUS_CODE');
  if (!hasStatusAssertion && testCase.expectedStatus) {
    assertionDefinitions.unshift({
      id: 'default-status',
      type: 'STATUS_CODE',
      target: 'statusCode',
      operator: 'equals',
      expectedValue: String(testCase.expectedStatus),
    });
  }

  const { passed: assertionsPassed, results: assertionResults } = evaluateAllAssertions(
    assertionDefinitions,
    {
      statusCode: proxyResult.statusCode,
      responseTimeMs: proxyResult.responseTimeMs,
      headers: proxyResult.headers,
      body: proxyResult.data,
      rawBody: proxyResult.rawBody,
    }
  );

  let finalStatus: 'PASSED' | 'FAILED' | 'ERROR' = 'PASSED';
  let errorMessage: string | null = null;

  if (proxyResult.isInfrastructureError) {
    finalStatus = 'ERROR';
    errorMessage = proxyResult.errorMessage || 'Network or connection error';
  } else if (!assertionsPassed) {
    finalStatus = 'FAILED';
    const failedOnes = assertionResults.filter((r) => !r.passed);
    errorMessage = failedOnes.map((f) => f.message).join(' | ');
  }

  // Create TestResult record
  const resultRecord = await prisma.testResult.create({
    data: {
      testRunId,
      testCaseId: testCase.id,
      status: finalStatus,
      statusCode: proxyResult.statusCode,
      responseTimeMs: proxyResult.responseTimeMs,
      responseSize: proxyResult.responseSizeBytes,
      responseHeaders: JSON.stringify(proxyResult.headers),
      responseBody: typeof proxyResult.data === 'object'
        ? JSON.stringify(proxyResult.data)
        : proxyResult.rawBody,
      errorMessage,
      assertionResults: JSON.stringify(assertionResults),
    },
    include: {
      testCase: {
        select: {
          id: true,
          testCaseId: true,
          name: true,
          method: true,
          path: true,
          category: true,
          priority: true,
        },
      },
    },
  });

  return {
    testCase,
    proxyResult,
    assertionsPassed,
    assertionResults,
    finalStatus,
    errorMessage,
    resultRecord,
  };
}

/**
 * Orchestrates a complete Test Run (individual, suite, or project batch)
 */
export async function executeTestRun(options: ExecutionOptions) {
  const { projectId, suiteId, testCaseIds, environmentName, triggeredBy = 'Manual' } = options;

  // 1. Fetch project and active environment
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { environments: true },
  });

  if (!project) {
    throw new Error(`Project with ID '${projectId}' was not found.`);
  }

  const targetEnvName = environmentName || project.currentEnv || 'Development';
  const activeEnv = project.environments.find((e) => e.name === targetEnvName);

  // Extract variables dictionary
  const envVars: Record<string, string> = {
    baseUrl: activeEnv?.baseUrl || project.baseUrl || 'http://localhost:5001',
  };

  if (activeEnv?.variables) {
    try {
      const parsedVars = JSON.parse(activeEnv.variables);
      if (Array.isArray(parsedVars)) {
        for (const item of parsedVars) {
          if (item.enabled !== false && item.key) {
            envVars[item.key] = item.value || '';
          }
        }
      }
    } catch {}
  }

  // 2. Identify test cases to run
  let targetTestCases: string[] = [];

  if (testCaseIds && testCaseIds.length > 0) {
    targetTestCases = testCaseIds;
  } else if (suiteId) {
    const suiteCases = await prisma.testCase.findMany({
      where: { projectId, suiteId },
      select: { id: true },
    });
    targetTestCases = suiteCases.map((c) => c.id);
  } else {
    // Run all test cases in the project
    const allCases = await prisma.testCase.findMany({
      where: { projectId },
      select: { id: true },
    });
    targetTestCases = allCases.map((c) => c.id);
  }

  const executionType = testCaseIds?.length === 1
    ? 'INDIVIDUAL'
    : suiteId
    ? 'SUITE'
    : 'PROJECT';

  // 3. Create initial TestRun record
  const testRun = await prisma.testRun.create({
    data: {
      projectId,
      suiteId: suiteId || null,
      executionType,
      status: 'RUNNING',
      totalTests: targetTestCases.length,
      environment: targetEnvName,
      triggeredBy,
    },
  });

  const startTime = Date.now();
  let passedCount = 0;
  let failedCount = 0;
  let errorCount = 0;
  const executedResults: any[] = [];

  // 4. Sequential execution of each test case
  for (const tcId of targetTestCases) {
    try {
      const singleRes = await executeSingleTestCase(
        tcId,
        testRun.id,
        envVars,
        project.baseUrl || 'http://localhost:5001'
      );

      if (singleRes.finalStatus === 'PASSED') passedCount++;
      else if (singleRes.finalStatus === 'FAILED') failedCount++;
      else errorCount++;

      executedResults.push(singleRes);
    } catch (err: any) {
      errorCount++;
      // Save error result
      await prisma.testResult.create({
        data: {
          testRunId: testRun.id,
          testCaseId: tcId,
          status: 'ERROR',
          errorMessage: err.message,
          assertionResults: '[]',
        },
      });
    }
  }

  const durationMs = Date.now() - startTime;
  const overallStatus =
    errorCount > 0 && passedCount === 0 && failedCount === 0
      ? 'ERROR'
      : failedCount > 0 || errorCount > 0
      ? 'FAILED'
      : 'PASSED';

  // 5. Finalize TestRun record
  const finalizedRun = await prisma.testRun.update({
    where: { id: testRun.id },
    data: {
      status: overallStatus,
      passedTests: passedCount,
      failedTests: failedCount + errorCount,
      skippedTests: 0,
      durationMs,
    },
    include: {
      testResults: {
        include: {
          testCase: true,
        },
      },
      project: { select: { id: true, name: true } },
      suite: { select: { id: true, name: true } },
    },
  });

  return finalizedRun;
}
