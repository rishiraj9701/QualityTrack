export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

export interface EnvironmentVariable {
  key: string;
  value: string;
  isSecret: boolean;
  enabled: boolean;
}

export interface Environment {
  id: string;
  projectId: string;
  name: string;
  baseUrl: string;
  variables: string; // JSON string
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string | null;
  baseUrl?: string | null;
  currentEnv: string;
  userId?: string | null;
  createdAt: string;
  updatedAt: string;
  environments?: Environment[];
  endpoints?: APIEndpoint[];
  testSuites?: TestSuite[];
  _count?: {
    endpoints: number;
    testCases: number;
    testSuites?: number;
    testRuns: number;
    bugReports: number;
  };
}

export interface APIEndpoint {
  id: string;
  projectId: string;
  name: string;
  method: string;
  path: string;
  description?: string | null;
  headers?: string | null;
  bodyTemplate?: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: {
    testCases: number;
    bugReports: number;
  };
}

export interface TestSuite {
  id: string;
  projectId: string;
  name: string;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
  testCases?: TestCase[];
  _count?: {
    testCases: number;
    testRuns?: number;
  };
}

export interface Assertion {
  id?: string;
  testCaseId?: string;
  type:
    | 'STATUS_CODE'
    | 'BODY_CONTAINS'
    | 'PROPERTY_EQUALS'
    | 'PROPERTY_TYPE'
    | 'RESPONSE_TIME'
    | 'TEXT_CONTAINS'
    | 'NOT_NULL';
  target?: string | null;
  operator:
    | 'equals'
    | 'not_equals'
    | 'contains'
    | 'not_contains'
    | 'less_than'
    | 'greater_than'
    | 'is_type'
    | 'not_null'
    | 'exists';
  expectedValue: string;
}

export interface TestCase {
  id: string;
  testCaseId: string;
  projectId: string;
  suiteId?: string | null;
  suite?: { id: string; name: string } | null;
  endpointId?: string | null;
  endpoint?: { id: string; name: string; method: string; path: string } | null;
  name: string;
  description?: string | null;
  method: string;
  path: string;
  headers?: string | null;
  queryParams?: string | null;
  body?: string | null;
  authType?: string | null;
  authConfig?: string | null;
  expectedStatus: number;
  category:
    | 'Positive Testing'
    | 'Negative Testing'
    | 'Boundary Testing'
    | 'Edge Case Testing'
    | 'Functional Testing'
    | 'Integration Testing';
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  assertions?: Assertion[];
  testResults?: TestResult[];
  createdAt: string;
  updatedAt: string;
}

export interface AssertionResult {
  assertionId?: string;
  type: string;
  target?: string | null;
  operator: string;
  expectedValue: string;
  actualValue: any;
  passed: boolean;
  message: string;
}

export interface TestResult {
  id: string;
  testRunId: string;
  testCaseId: string;
  testCase?: TestCase;
  status: 'PASSED' | 'FAILED' | 'SKIPPED' | 'ERROR';
  statusCode?: number | null;
  responseTimeMs?: number | null;
  responseSize?: number | null;
  responseHeaders?: string | null;
  responseBody?: string | null;
  errorMessage?: string | null;
  assertionResults?: string | null;
  createdAt: string;
  bugReports?: BugReport[];
}

export interface TestRun {
  id: string;
  projectId: string;
  project?: { id: string; name: string };
  suiteId?: string | null;
  suite?: { id: string; name: string } | null;
  executionType: 'INDIVIDUAL' | 'SUITE' | 'PROJECT' | 'AUTOMATED';
  status: 'PENDING' | 'RUNNING' | 'PASSED' | 'FAILED' | 'ERROR';
  totalTests: number;
  passedTests: number;
  failedTests: number;
  skippedTests: number;
  durationMs: number;
  environment: string;
  triggeredBy: string;
  createdAt: string;
  updatedAt: string;
  testResults?: TestResult[];
  _count?: {
    testResults: number;
  };
}

export interface BugReport {
  id: string;
  bugId: string;
  title: string;
  description: string;
  stepsToReproduce: string;
  expectedResult: string;
  actualResult: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  priority: 'High' | 'Medium' | 'Low';
  status: 'Open' | 'In Progress' | 'Resolved' | 'Closed';
  projectId: string;
  project?: { id: string; name: string };
  endpointId?: string | null;
  endpoint?: { id: string; name: string; method: string; path: string } | null;
  testCaseId?: string | null;
  testCase?: { id: string; testCaseId: string; name: string } | null;
  testResultId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardStats {
  totalProjects: number;
  totalEndpoints: number;
  totalTestCases: number;
  totalRuns: number;
  totalExecutions: number;
  passedTests: number;
  failedTests: number;
  skippedTests: number;
  errorTests: number;
  passRate: number;
}
