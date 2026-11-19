import {
  evaluateAssertion,
  evaluateAllAssertions,
  getNestedProperty,
  HttpResponseContext,
} from '../src/services/assertionEvaluator';

describe('Assertion Evaluator Engine', () => {
  const sampleResponse: HttpResponseContext = {
    statusCode: 201,
    responseTimeMs: 120,
    headers: { 'content-type': 'application/json' },
    body: {
      success: true,
      user: {
        id: 'usr_abc123',
        name: 'Rishi Kumar',
        email: 'demo@qualitytrack.local',
        roles: ['QA', 'Automation'],
        age: 22,
        metadata: null,
      },
      count: 42,
    },
    rawBody: '{"success":true,"user":{"id":"usr_abc123","email":"demo@qualitytrack.local"}}',
  };

  test('resolves nested property paths correctly', () => {
    expect(getNestedProperty(sampleResponse.body, 'user.email')).toBe('demo@qualitytrack.local');
    expect(getNestedProperty(sampleResponse.body, 'user.roles[0]')).toBe('QA');
    expect(getNestedProperty(sampleResponse.body, 'user.roles[1]')).toBe('Automation');
    expect(getNestedProperty(sampleResponse.body, 'user.nonexistent')).toBeUndefined();
  });

  test('evaluates STATUS_CODE assertion correctly (PASS & FAIL)', () => {
    const passResult = evaluateAssertion(
      { type: 'STATUS_CODE', operator: 'equals', expectedValue: '201' },
      sampleResponse
    );
    expect(passResult.passed).toBe(true);

    const failResult = evaluateAssertion(
      { type: 'STATUS_CODE', operator: 'equals', expectedValue: '200' },
      sampleResponse
    );
    expect(failResult.passed).toBe(false);
    expect(failResult.message).toContain('Expected status code equals 200, but received 201');
  });

  test('evaluates PROPERTY_EQUALS assertion for strings, booleans, and numbers', () => {
    const emailCheck = evaluateAssertion(
      {
        type: 'PROPERTY_EQUALS',
        target: 'user.email',
        operator: 'equals',
        expectedValue: 'demo@qualitytrack.local',
      },
      sampleResponse
    );
    expect(emailCheck.passed).toBe(true);

    const boolCheck = evaluateAssertion(
      {
        type: 'PROPERTY_EQUALS',
        target: 'success',
        operator: 'equals',
        expectedValue: 'true',
      },
      sampleResponse
    );
    expect(boolCheck.passed).toBe(true);

    const numCheck = evaluateAssertion(
      {
        type: 'PROPERTY_EQUALS',
        target: 'count',
        operator: 'equals',
        expectedValue: '42',
      },
      sampleResponse
    );
    expect(numCheck.passed).toBe(true);
  });

  test('evaluates PROPERTY_TYPE assertion for array and string', () => {
    const arrayCheck = evaluateAssertion(
      {
        type: 'PROPERTY_TYPE',
        target: 'user.roles',
        operator: 'is_type',
        expectedValue: 'array',
      },
      sampleResponse
    );
    expect(arrayCheck.passed).toBe(true);

    const stringCheck = evaluateAssertion(
      {
        type: 'PROPERTY_TYPE',
        target: 'user.name',
        operator: 'is_type',
        expectedValue: 'string',
      },
      sampleResponse
    );
    expect(stringCheck.passed).toBe(true);
  });

  test('evaluates RESPONSE_TIME threshold assertion', () => {
    const fastCheck = evaluateAssertion(
      {
        type: 'RESPONSE_TIME',
        operator: 'less_than',
        expectedValue: '500',
      },
      sampleResponse
    );
    expect(fastCheck.passed).toBe(true);

    const slowCheck = evaluateAssertion(
      {
        type: 'RESPONSE_TIME',
        operator: 'less_than',
        expectedValue: '50',
      },
      sampleResponse
    );
    expect(slowCheck.passed).toBe(false);
  });

  test('evaluates BODY_CONTAINS and NOT_NULL assertions', () => {
    const containsCheck = evaluateAssertion(
      {
        type: 'BODY_CONTAINS',
        operator: 'contains',
        expectedValue: 'usr_abc123',
      },
      sampleResponse
    );
    expect(containsCheck.passed).toBe(true);

    const notNullCheck = evaluateAssertion(
      {
        type: 'NOT_NULL',
        target: 'user.id',
        operator: 'not_null',
        expectedValue: 'not null',
      },
      sampleResponse
    );
    expect(notNullCheck.passed).toBe(true);
  });

  test('evaluates multiple assertions in batch with overall pass/fail outcome', () => {
    const batch = evaluateAllAssertions(
      [
        { type: 'STATUS_CODE', operator: 'equals', expectedValue: '201' },
        { type: 'PROPERTY_EQUALS', target: 'user.id', operator: 'equals', expectedValue: 'usr_abc123' },
        { type: 'RESPONSE_TIME', operator: 'less_than', expectedValue: '1000' },
      ],
      sampleResponse
    );
    expect(batch.passed).toBe(true);
    expect(batch.results).toHaveLength(3);
  });
});
