export interface AssertionDefinition {
  id?: string;
  type:
    | 'STATUS_CODE'
    | 'BODY_CONTAINS'
    | 'PROPERTY_EQUALS'
    | 'PROPERTY_TYPE'
    | 'RESPONSE_TIME'
    | 'TEXT_CONTAINS'
    | 'NOT_NULL';
  target?: string | null; // e.g. "user.email", "items[0].id", null for status/text
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

export interface AssertionEvaluationResult {
  assertionId?: string;
  type: string;
  target?: string | null;
  operator: string;
  expectedValue: string;
  actualValue: any;
  passed: boolean;
  message: string;
}

export interface HttpResponseContext {
  statusCode: number;
  responseTimeMs: number;
  headers: Record<string, any>;
  body: any; // parsed JSON or string
  rawBody: string;
}

/**
 * Safely resolves nested property path like 'user.profile.name' or 'items[0].id'
 */
export function getNestedProperty(obj: any, path: string): any {
  if (!obj || !path) return undefined;

  // Normalize array notation: a[0].b -> a.0.b
  const normalizedPath = path.replace(/\[(\w+)\]/g, '.$1').replace(/^\./, '');
  const keys = normalizedPath.split('.');

  let current = obj;
  for (const key of keys) {
    if (current === null || current === undefined) {
      return undefined;
    }
    current = current[key];
  }
  return current;
}

/**
 * Evaluates a single assertion against the HTTP Response context
 */
export function evaluateAssertion(
  assertion: AssertionDefinition,
  response: HttpResponseContext
): AssertionEvaluationResult {
  const { id, type, target, operator, expectedValue } = assertion;

  try {
    switch (type) {
      case 'STATUS_CODE': {
        const actualStatus = response.statusCode;
        const expectedStatus = parseInt(expectedValue, 10);
        const passed = operator === 'not_equals'
          ? actualStatus !== expectedStatus
          : actualStatus === expectedStatus;

        return {
          assertionId: id,
          type,
          target: 'statusCode',
          operator,
          expectedValue,
          actualValue: actualStatus,
          passed,
          message: passed
            ? `Status code ${actualStatus} satisfies condition ${operator} ${expectedValue}`
            : `Expected status code ${operator} ${expectedValue}, but received ${actualStatus}`,
        };
      }

      case 'RESPONSE_TIME': {
        const actualTime = response.responseTimeMs;
        const threshold = parseFloat(expectedValue);
        let passed = false;

        if (operator === 'less_than') {
          passed = actualTime <= threshold;
        } else if (operator === 'greater_than') {
          passed = actualTime >= threshold;
        } else {
          passed = actualTime <= threshold; // default threshold
        }

        return {
          assertionId: id,
          type,
          target: 'responseTimeMs',
          operator,
          expectedValue,
          actualValue: `${actualTime}ms`,
          passed,
          message: passed
            ? `Response time ${actualTime}ms is ${operator} ${threshold}ms`
            : `Response time ${actualTime}ms exceeded threshold of ${threshold}ms`,
        };
      }

      case 'BODY_CONTAINS': {
        const needle = expectedValue;
        let passed = false;

        if (typeof response.body === 'object' && response.body !== null) {
          const bodyStr = JSON.stringify(response.body);
          passed = bodyStr.includes(needle);
        } else {
          passed = String(response.rawBody || '').includes(needle);
        }

        return {
          assertionId: id,
          type,
          target: target || 'body',
          operator: 'contains',
          expectedValue,
          actualValue: passed ? 'Found' : 'Not found',
          passed,
          message: passed
            ? `Response body contains '${needle}'`
            : `Response body does not contain expected substring '${needle}'`,
        };
      }

      case 'TEXT_CONTAINS': {
        const passed = String(response.rawBody || '').includes(expectedValue);
        return {
          assertionId: id,
          type,
          target: 'rawBody',
          operator: 'contains',
          expectedValue,
          actualValue: response.rawBody ? `${response.rawBody.substring(0, 100)}...` : '',
          passed,
          message: passed
            ? `Raw response contains text '${expectedValue}'`
            : `Raw response does not contain expected text '${expectedValue}'`,
        };
      }

      case 'PROPERTY_EQUALS': {
        if (!target) {
          return {
            assertionId: id,
            type,
            target,
            operator,
            expectedValue,
            actualValue: null,
            passed: false,
            message: 'Target property path is required for PROPERTY_EQUALS assertion',
          };
        }

        const actualVal = getNestedProperty(response.body, target);

        // Normalize comparison for booleans, numbers, strings, and null
        let passed = false;
        let normalizedExpected: any = expectedValue;

        if (expectedValue === 'null') normalizedExpected = null;
        else if (expectedValue === 'true') normalizedExpected = true;
        else if (expectedValue === 'false') normalizedExpected = false;
        else if (!isNaN(Number(expectedValue)) && expectedValue.trim() !== '') {
          // If actual is a number, compare as number
          if (typeof actualVal === 'number') {
            normalizedExpected = Number(expectedValue);
          }
        }

        if (operator === 'equals') {
          // eslint-disable-next-line eqeqeq
          passed = actualVal == normalizedExpected || String(actualVal) === String(expectedValue);
        } else if (operator === 'not_equals') {
          // eslint-disable-next-line eqeqeq
          passed = actualVal != normalizedExpected && String(actualVal) !== String(expectedValue);
        } else if (operator === 'contains') {
          passed = String(actualVal || '').includes(expectedValue);
        }

        return {
          assertionId: id,
          type,
          target,
          operator,
          expectedValue,
          actualValue: actualVal,
          passed,
          message: passed
            ? `Property '${target}' satisfies: ${operator} '${expectedValue}'`
            : `Expected property '${target}' to ${operator} '${expectedValue}', but got '${JSON.stringify(actualVal)}'`,
        };
      }

      case 'PROPERTY_TYPE': {
        if (!target) {
          return {
            assertionId: id,
            type,
            target,
            operator,
            expectedValue,
            actualValue: null,
            passed: false,
            message: 'Target property path is required for PROPERTY_TYPE assertion',
          };
        }

        const actualVal = getNestedProperty(response.body, target);
        let actualType: string = typeof actualVal;
        if (actualVal === null) actualType = 'null';
        else if (Array.isArray(actualVal)) actualType = 'array';

        const expectedType = expectedValue.toLowerCase();
        const passed = actualType === expectedType;

        return {
          assertionId: id,
          type,
          target,
          operator: 'is_type',
          expectedValue: expectedType,
          actualValue: actualType,
          passed,
          message: passed
            ? `Property '${target}' has expected type '${expectedType}'`
            : `Expected property '${target}' to be type '${expectedType}', but got '${actualType}'`,
        };
      }

      case 'NOT_NULL': {
        if (!target) {
          return {
            assertionId: id,
            type,
            target,
            operator,
            expectedValue: 'not null',
            actualValue: null,
            passed: false,
            message: 'Target property path is required for NOT_NULL assertion',
          };
        }

        const actualVal = getNestedProperty(response.body, target);
        const passed = actualVal !== null && actualVal !== undefined;

        return {
          assertionId: id,
          type,
          target,
          operator: 'not_null',
          expectedValue: 'not null',
          actualValue: actualVal === null ? 'null' : actualVal === undefined ? 'undefined' : 'present',
          passed,
          message: passed
            ? `Property '${target}' is not null/undefined`
            : `Expected property '${target}' to be present and not null, but received '${actualVal}'`,
        };
      }

      default:
        return {
          assertionId: id,
          type,
          target,
          operator,
          expectedValue,
          actualValue: null,
          passed: false,
          message: `Unknown assertion type: ${type}`,
        };
    }
  } catch (err: any) {
    return {
      assertionId: id,
      type,
      target,
      operator,
      expectedValue,
      actualValue: null,
      passed: false,
      message: `Error during assertion evaluation: ${err.message}`,
    };
  }
}

/**
 * Evaluates a list of assertions against the response
 */
export function evaluateAllAssertions(
  assertions: AssertionDefinition[],
  response: HttpResponseContext
): {
  passed: boolean;
  results: AssertionEvaluationResult[];
} {
  if (!assertions || assertions.length === 0) {
    // If no assertions specified, default to matching status code if < 400 or pass
    return { passed: true, results: [] };
  }

  const results = assertions.map((a) => evaluateAssertion(a, response));
  const passed = results.every((r) => r.passed);

  return { passed, results };
}
