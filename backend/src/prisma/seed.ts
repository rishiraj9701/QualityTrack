import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('[Seed] Starting database population...');

  // 1. Create or get Default User
  const passwordHash = await bcrypt.hash('Password123!', 10);
  const user = await prisma.user.upsert({
    where: { email: 'demo@qualitytrack.local' },
    update: {},
    create: {
      email: 'demo@qualitytrack.local',
      name: 'Rishi Kumar',
      passwordHash,
      role: 'QA_ENGINEER',
    },
  });
  console.log(`[Seed] User ready: ${user.email}`);

  // 2. Create Project
  const project = await prisma.project.upsert({
    where: { id: 'proj_demo_101' },
    update: {},
    create: {
      id: 'proj_demo_101',
      name: 'User Management API',
      description: 'Demonstration testbed validating user registration, authentication, boundary checks, and edge cases.',
      baseUrl: 'http://localhost:5001',
      currentEnv: 'Development',
      userId: user.id,
    },
  });
  console.log(`[Seed] Project ready: ${project.name}`);

  // 3. Create Environments
  const devVars = [
    { key: 'baseUrl', value: 'http://localhost:5001', isSecret: false, enabled: true },
    { key: 'apiKey', value: 'qk_live_demo_token_89712', isSecret: true, enabled: true },
    { key: 'apiVersion', value: 'v1', isSecret: false, enabled: true },
  ];

  const stagingVars = [
    { key: 'baseUrl', value: 'https://staging-api.qualitytrack.io', isSecret: false, enabled: true },
    { key: 'apiKey', value: 'qk_staging_secret_key', isSecret: true, enabled: true },
  ];

  await prisma.environment.upsert({
    where: { projectId_name: { projectId: project.id, name: 'Development' } },
    update: { variables: JSON.stringify(devVars) },
    create: {
      projectId: project.id,
      name: 'Development',
      baseUrl: 'http://localhost:5001',
      variables: JSON.stringify(devVars),
    },
  });

  await prisma.environment.upsert({
    where: { projectId_name: { projectId: project.id, name: 'Staging' } },
    update: { variables: JSON.stringify(stagingVars) },
    create: {
      projectId: project.id,
      name: 'Staging',
      baseUrl: 'https://staging-api.qualitytrack.io',
      variables: JSON.stringify(stagingVars),
    },
  });

  await prisma.environment.upsert({
    where: { projectId_name: { projectId: project.id, name: 'Production' } },
    update: {},
    create: {
      projectId: project.id,
      name: 'Production',
      baseUrl: 'https://api.qualitytrack.io',
      variables: JSON.stringify([
        { key: 'baseUrl', value: 'https://api.qualitytrack.io', isSecret: false, enabled: true },
      ]),
    },
  });

  // Clean up any old references and seed data to ensure seed is 100% idempotent
  await prisma.bugReport.deleteMany({});
  await prisma.testResult.deleteMany({});
  await prisma.testRun.deleteMany({});
  await prisma.testCase.deleteMany({});
  await prisma.testSuite.deleteMany({});
  await prisma.aPIEndpoint.deleteMany({});
  await prisma.project.deleteMany({ where: { id: 'proj_signzy_demo_101' } }).catch(() => {});

  // 4. Create API Endpoints
  const epUsersList = await prisma.aPIEndpoint.create({
    data: {
      projectId: project.id,
      name: 'List Users',
      method: 'GET',
      path: '/api/users',
      description: 'Retrieves a paginated list of registered users with optional search filter',
    },
  });

  const epGetUser = await prisma.aPIEndpoint.create({
    data: {
      projectId: project.id,
      name: 'Get User By ID',
      method: 'GET',
      path: '/api/users/:id',
      description: 'Fetch user details by their unique identifier',
    },
  });

  const epCreateUser = await prisma.aPIEndpoint.create({
    data: {
      projectId: project.id,
      name: 'Register User',
      method: 'POST',
      path: '/api/users',
      description: 'Registers a new user with validation on email, name, and password',
      bodyTemplate: JSON.stringify({
        name: 'John Doe',
        email: 'john.doe@example.com',
        password: 'Password123!',
        role: 'Member',
      }),
    },
  });

  const epDeleteUser = await prisma.aPIEndpoint.create({
    data: {
      projectId: project.id,
      name: 'Delete User',
      method: 'DELETE',
      path: '/api/users/:id',
      description: 'Removes a user account by ID',
    },
  });

  // 5. Create Test Suites
  const smokeSuite = await prisma.testSuite.create({
    data: {
      projectId: project.id,
      name: 'Smoke Test Suite',
      description: 'High-priority critical path validation for core API endpoints',
    },
  });

  const positiveSuite = await prisma.testSuite.create({
    data: {
      projectId: project.id,
      name: 'Positive Testing Suite',
      description: 'Happy-path validations ensuring standard requests return 200/201 with expected schemas',
    },
  });

  const negativeSuite = await prisma.testSuite.create({
    data: {
      projectId: project.id,
      name: 'Negative & Error Handling Suite',
      description: 'Validates 400 Bad Request, 404 Not Found, and 409 Conflict rejection handling',
    },
  });

  const boundarySuite = await prisma.testSuite.create({
    data: {
      projectId: project.id,
      name: 'Boundary & Edge Case Suite',
      description: 'Stress-tests string lengths, empty bodies, and boundary conditions',
    },
  });

  // 6. Create Test Cases with Assertions (TC001 to TC010)

  // TC001: Valid User Registration (Positive)
  const tc001 = await prisma.testCase.create({
    data: {
      testCaseId: 'TC001',
      projectId: project.id,
      suiteId: positiveSuite.id,
      endpointId: epCreateUser.id,
      name: 'TC001 – Valid User Registration',
      description: 'Verify that valid registration payload returns 201 Created with generated user ID',
      method: 'POST',
      path: '/api/users',
      headers: JSON.stringify({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({
        name: 'Kavya Singh',
        email: 'kavya.singh@example.com',
        password: 'Password123!',
        role: 'QA Specialist',
      }),
      expectedStatus: 201,
      category: 'Positive Testing',
      priority: 'High',
      assertions: {
        create: [
          { type: 'STATUS_CODE', operator: 'equals', expectedValue: '201' },
          { type: 'PROPERTY_EQUALS', target: 'user.name', operator: 'equals', expectedValue: 'Kavya Singh' },
          { type: 'PROPERTY_EQUALS', target: 'user.email', operator: 'equals', expectedValue: 'kavya.singh@example.com' },
          { type: 'NOT_NULL', target: 'user.id', operator: 'not_null', expectedValue: 'not null' },
          { type: 'RESPONSE_TIME', operator: 'less_than', expectedValue: '1500' },
        ],
      },
    },
  });

  // TC002: Invalid Email Registration (Negative)
  const tc002 = await prisma.testCase.create({
    data: {
      testCaseId: 'TC002',
      projectId: project.id,
      suiteId: negativeSuite.id,
      endpointId: epCreateUser.id,
      name: 'TC002 – Invalid Email Registration',
      description: 'Verify that registering with malformed email triggers 400 Bad Request with validation message',
      method: 'POST',
      path: '/api/users',
      headers: JSON.stringify({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({
        name: 'Invalid Tester',
        email: 'invalid-email-format-without-at',
        password: 'Password123!',
      }),
      expectedStatus: 400,
      category: 'Negative Testing',
      priority: 'High',
      assertions: {
        create: [
          { type: 'STATUS_CODE', operator: 'equals', expectedValue: '400' },
          { type: 'PROPERTY_EQUALS', target: 'error', operator: 'equals', expectedValue: 'Validation Error' },
          { type: 'PROPERTY_EQUALS', target: 'field', operator: 'equals', expectedValue: 'email' },
          { type: 'BODY_CONTAINS', operator: 'contains', expectedValue: 'Invalid email address format' },
        ],
      },
    },
  });

  // TC003: Missing Password (Negative)
  const tc003 = await prisma.testCase.create({
    data: {
      testCaseId: 'TC003',
      projectId: project.id,
      suiteId: negativeSuite.id,
      endpointId: epCreateUser.id,
      name: 'TC003 – Missing Password',
      description: 'Verify that omitting required password returns 400 Validation Error',
      method: 'POST',
      path: '/api/users',
      headers: JSON.stringify({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({
        name: 'No Password User',
        email: 'nopassword@example.com',
      }),
      expectedStatus: 400,
      category: 'Negative Testing',
      priority: 'High',
      assertions: {
        create: [
          { type: 'STATUS_CODE', operator: 'equals', expectedValue: '400' },
          { type: 'PROPERTY_EQUALS', target: 'field', operator: 'equals', expectedValue: 'password' },
        ],
      },
    },
  });

  // TC004: Duplicate Email Registration (Negative)
  const tc004 = await prisma.testCase.create({
    data: {
      testCaseId: 'TC004',
      projectId: project.id,
      suiteId: negativeSuite.id,
      endpointId: epCreateUser.id,
      name: 'TC004 – Duplicate Email Registration',
      description: 'Verify that attempting to register existing email returns 409 Conflict',
      method: 'POST',
      path: '/api/users',
      headers: JSON.stringify({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({
        name: 'Duplicate Aarav',
        email: 'aarav.sharma@example.com',
        password: 'Password123!',
      }),
      expectedStatus: 409,
      category: 'Negative Testing',
      priority: 'High',
      assertions: {
        create: [
          { type: 'STATUS_CODE', operator: 'equals', expectedValue: '409' },
          { type: 'PROPERTY_EQUALS', target: 'error', operator: 'equals', expectedValue: 'Conflict' },
          { type: 'BODY_CONTAINS', operator: 'contains', expectedValue: 'already exists' },
        ],
      },
    },
  });

  // TC005: Empty Request Body (Boundary)
  const tc005 = await prisma.testCase.create({
    data: {
      testCaseId: 'TC005',
      projectId: project.id,
      suiteId: boundarySuite.id,
      endpointId: epCreateUser.id,
      name: 'TC005 – Empty Request Body',
      description: 'Verify system behavior when sending empty JSON payload {}',
      method: 'POST',
      path: '/api/users',
      headers: JSON.stringify({ 'Content-Type': 'application/json' }),
      body: '{}',
      expectedStatus: 400,
      category: 'Boundary Testing',
      priority: 'Medium',
      assertions: {
        create: [
          { type: 'STATUS_CODE', operator: 'equals', expectedValue: '400' },
          { type: 'BODY_CONTAINS', operator: 'contains', expectedValue: 'Request body cannot be empty' },
        ],
      },
    },
  });

  // TC006: Non-existent User ID (Negative)
  const tc006 = await prisma.testCase.create({
    data: {
      testCaseId: 'TC006',
      projectId: project.id,
      suiteId: negativeSuite.id,
      endpointId: epGetUser.id,
      name: 'TC006 – Non-existent User Lookup',
      description: 'Verify that requesting an unknown user ID returns 404 Not Found',
      method: 'GET',
      path: '/api/users/usr_nonexistent_99999',
      expectedStatus: 404,
      category: 'Negative Testing',
      priority: 'Medium',
      assertions: {
        create: [
          { type: 'STATUS_CODE', operator: 'equals', expectedValue: '404' },
          { type: 'PROPERTY_EQUALS', target: 'error', operator: 'equals', expectedValue: 'Not Found' },
        ],
      },
    },
  });

  // TC007: Fetch All Users List (Positive)
  const tc007 = await prisma.testCase.create({
    data: {
      testCaseId: 'TC007',
      projectId: project.id,
      suiteId: smokeSuite.id,
      endpointId: epUsersList.id,
      name: 'TC007 – Fetch All Users List',
      description: 'Verify that GET /api/users returns 200 with active user array',
      method: 'GET',
      path: '/api/users',
      expectedStatus: 200,
      category: 'Positive Testing',
      priority: 'High',
      assertions: {
        create: [
          { type: 'STATUS_CODE', operator: 'equals', expectedValue: '200' },
          { type: 'PROPERTY_TYPE', target: 'users', operator: 'is_type', expectedValue: 'array' },
          { type: 'PROPERTY_EQUALS', target: 'success', operator: 'equals', expectedValue: 'true' },
          { type: 'RESPONSE_TIME', operator: 'less_than', expectedValue: '800' },
        ],
      },
    },
  });

  // TC008: Extremely Long Name Input (Boundary)
  const longName = 'A'.repeat(105);
  const tc008 = await prisma.testCase.create({
    data: {
      testCaseId: 'TC008',
      projectId: project.id,
      suiteId: boundarySuite.id,
      endpointId: epCreateUser.id,
      name: 'TC008 – Extremely Long Input (>100 chars)',
      description: 'Boundary check: verify that name exceeding 100 characters is rejected with 400',
      method: 'POST',
      path: '/api/users',
      headers: JSON.stringify({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({
        name: longName,
        email: 'longname.test@example.com',
        password: 'Password123!',
      }),
      expectedStatus: 400,
      category: 'Boundary Testing',
      priority: 'Medium',
      assertions: {
        create: [
          { type: 'STATUS_CODE', operator: 'equals', expectedValue: '400' },
          { type: 'BODY_CONTAINS', operator: 'contains', expectedValue: 'exceeds maximum length' },
        ],
      },
    },
  });

  // TC009: Short Password Boundary (Boundary)
  const tc009 = await prisma.testCase.create({
    data: {
      testCaseId: 'TC009',
      projectId: project.id,
      suiteId: boundarySuite.id,
      endpointId: epCreateUser.id,
      name: 'TC009 – Short Password Boundary (<8 chars)',
      description: 'Boundary check: verify that password shorter than 8 characters is rejected with 400',
      method: 'POST',
      path: '/api/users',
      headers: JSON.stringify({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({
        name: 'Short Pass User',
        email: 'shortpass@example.com',
        password: '12345',
      }),
      expectedStatus: 400,
      category: 'Boundary Testing',
      priority: 'Medium',
      assertions: {
        create: [
          { type: 'STATUS_CODE', operator: 'equals', expectedValue: '400' },
          { type: 'BODY_CONTAINS', operator: 'contains', expectedValue: 'at least 8 characters' },
        ],
      },
    },
  });

  // TC010: Successful User Deletion (Functional)
  const tc010 = await prisma.testCase.create({
    data: {
      testCaseId: 'TC010',
      projectId: project.id,
      suiteId: smokeSuite.id,
      endpointId: epDeleteUser.id,
      name: 'TC010 – Successful User Deletion',
      description: 'Verify deleting existing inactive user returns 200 with deletion confirmation',
      method: 'DELETE',
      path: '/api/users/usr_104',
      expectedStatus: 200,
      category: 'Functional Testing',
      priority: 'Medium',
      assertions: {
        create: [
          { type: 'STATUS_CODE', operator: 'equals', expectedValue: '200' },
          { type: 'BODY_CONTAINS', operator: 'contains', expectedValue: 'deleted successfully' },
        ],
      },
    },
  });

  console.log(`[Seed] 10 Realistic Test Cases created across Positive, Negative, Boundary & Functional suites.`);

  // 7. Seed sample historical test runs
  const sampleRun = await prisma.testRun.create({
    data: {
      projectId: project.id,
      suiteId: positiveSuite.id,
      executionType: 'SUITE',
      status: 'PASSED',
      totalTests: 2,
      passedTests: 2,
      failedTests: 0,
      skippedTests: 0,
      durationMs: 420,
      environment: 'Development',
      triggeredBy: 'Rishi Kumar',
      testResults: {
        create: [
          {
            testCaseId: tc001.id,
            status: 'PASSED',
            statusCode: 201,
            responseTimeMs: 85,
            responseSize: 248,
            responseHeaders: JSON.stringify({ 'content-type': 'application/json; charset=utf-8' }),
            responseBody: JSON.stringify({
              success: true,
              user: { id: 'usr_sample_101', name: 'Kavya Singh', email: 'kavya.singh@example.com' },
            }),
            assertionResults: JSON.stringify([
              { type: 'STATUS_CODE', operator: 'equals', expectedValue: '201', actualValue: 201, passed: true, message: 'Status code matches' },
              { type: 'PROPERTY_EQUALS', target: 'user.name', operator: 'equals', expectedValue: 'Kavya Singh', actualValue: 'Kavya Singh', passed: true, message: 'Name matches' },
            ]),
          },
          {
            testCaseId: tc007.id,
            status: 'PASSED',
            statusCode: 200,
            responseTimeMs: 42,
            responseSize: 1120,
            responseHeaders: JSON.stringify({ 'content-type': 'application/json; charset=utf-8' }),
            responseBody: JSON.stringify({ success: true, total: 4 }),
            assertionResults: JSON.stringify([
              { type: 'STATUS_CODE', operator: 'equals', expectedValue: '200', actualValue: 200, passed: true, message: 'Status code matches' },
            ]),
          },
        ],
      },
    },
  });

  // 8. Seed sample Bug Reports
  await prisma.bugReport.create({
    data: {
      bugId: 'BUG-001',
      title: 'Duplicate email error response schema missing standard error code property',
      description: 'When submitting a duplicate email registration, the API returns HTTP 409 but omits the standard numeric error code required by the client SDK contract.',
      stepsToReproduce: '1. Send POST /api/users with an existing email address\n2. Observe response status 409\n3. Inspect JSON body',
      expectedResult: 'Response body should include { "success": false, "code": "ERR_DUPLICATE_EMAIL", "error": "Conflict" }',
      actualResult: 'Response body only contains { "success": false, "error": "Conflict", "message": "..." } without error code',
      severity: 'Medium',
      priority: 'Medium',
      status: 'Open',
      projectId: project.id,
      endpointId: epCreateUser.id,
      testCaseId: tc004.id,
    },
  });

  await prisma.bugReport.create({
    data: {
      bugId: 'BUG-002',
      title: 'Boundary violation on 101 char name does not specify max constraint in error body',
      description: 'Submitting a name of 105 characters returns 400 but error string does not programmatically provide the maximum length number.',
      stepsToReproduce: '1. Send POST /api/users with name of 105 characters\n2. Inspect response error message',
      expectedResult: 'Expected field "maxLength": 100 in error payload',
      actualResult: 'Plain text message returned: "Name exceeds maximum length of 100 characters."',
      severity: 'Low',
      priority: 'Low',
      status: 'In Progress',
      projectId: project.id,
      endpointId: epCreateUser.id,
      testCaseId: tc008.id,
    },
  });

  console.log('[Seed] Database successfully seeded with full project data, endpoints, suites, test cases, runs, and bugs!');
}

main()
  .catch((e) => {
    console.error('[Seed Error]:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
