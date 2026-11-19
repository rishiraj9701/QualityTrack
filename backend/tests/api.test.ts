import request from 'supertest';
import app, { server } from '../src/server';
import { prisma } from '../src/prisma/client';

describe('QualityTrack Backend REST API Integration Tests', () => {
  let createdProjectId: string;
  let createdEndpointId: string;
  let createdTestCaseId: string;
  let createdBugId: string;

  afterAll(async () => {
    // Clean up test records
    if (createdProjectId) {
      await prisma.project.delete({ where: { id: createdProjectId } }).catch(() => {});
    }
    server.close();
    await prisma.$disconnect();
  });

  test('GET /api/health returns 200 UP', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('UP');
    expect(res.body.platform).toContain('QualityTrack');
  });

  describe('Authentication Module', () => {
    const testEmail = `qa.test.${Date.now()}@example.com`;

    test('POST /api/auth/register creates user and returns JWT', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Integration Tester',
          email: testEmail,
          password: 'TestPassword123!',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
      expect(res.body.user.email).toBe(testEmail);
    });

    test('POST /api/auth/login logs in with valid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testEmail,
          password: 'TestPassword123!',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
    });

    test('POST /api/auth/login rejects invalid password with 401', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testEmail,
          password: 'WrongPassword!',
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('Project & Environment Management', () => {
    test('POST /api/projects creates project with default environments', async () => {
      const res = await request(app)
        .post('/api/projects')
        .send({
          name: 'Automated Testbed Project',
          description: 'Testing project lifecycle through Supertest',
          baseUrl: 'http://localhost:5001',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.project.name).toBe('Automated Testbed Project');
      expect(res.body.project.environments).toHaveLength(3); // Dev, Staging, Prod

      createdProjectId = res.body.project.id;
    });

    test('GET /api/projects lists projects with counts', async () => {
      const res = await request(app).get('/api/projects');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.projects)).toBe(true);
      expect(res.body.projects.length).toBeGreaterThan(0);
    });

    test('GET /api/projects/:id returns full project metadata', async () => {
      const res = await request(app).get(`/api/projects/${createdProjectId}`);
      expect(res.status).toBe(200);
      expect(res.body.project.id).toBe(createdProjectId);
    });
  });

  describe('Endpoints & Test Cases Management', () => {
    test('POST /api/endpoints creates API endpoint under project', async () => {
      const res = await request(app)
        .post('/api/endpoints')
        .send({
          projectId: createdProjectId,
          name: 'Create User Endpoint',
          method: 'POST',
          path: '/api/users',
          description: 'User registration endpoint',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.endpoint.method).toBe('POST');
      createdEndpointId = res.body.endpoint.id;
    });

    test('POST /api/test-cases creates test case with assertions', async () => {
      const res = await request(app)
        .post('/api/test-cases')
        .send({
          projectId: createdProjectId,
          endpointId: createdEndpointId,
          name: 'TC999 – Supertest Verification Case',
          method: 'GET',
          path: '/api/users',
          expectedStatus: 200,
          category: 'Positive Testing',
          priority: 'High',
          assertions: [
            { type: 'STATUS_CODE', target: 'statusCode', operator: 'equals', expectedValue: '200' },
            { type: 'RESPONSE_TIME', operator: 'less_than', expectedValue: '1000' },
          ],
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.testCase.assertions).toHaveLength(2);
      createdTestCaseId = res.body.testCase.id;
    });

    test('POST /api/test-cases/:id/duplicate duplicates the test case', async () => {
      const res = await request(app).post(`/api/test-cases/${createdTestCaseId}/duplicate`);
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.testCase.name).toContain('(Copy)');
    });
  });

  describe('Bug Reports & Defect Tracking', () => {
    test('POST /api/bugs creates a bug report', async () => {
      const res = await request(app)
        .post('/api/bugs')
        .send({
          projectId: createdProjectId,
          title: 'Defect: Test case response timeout',
          description: 'Supertest observed mock failure',
          severity: 'High',
          priority: 'High',
          status: 'Open',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.bug.bugId).toMatch(/^BUG-\d+/);
      createdBugId = res.body.bug.id;
    });

    test('PUT /api/bugs/:id updates status to Resolved', async () => {
      const res = await request(app)
        .put(`/api/bugs/${createdBugId}`)
        .send({ status: 'Resolved' });

      expect(res.status).toBe(200);
      expect(res.body.bug.status).toBe('Resolved');
    });
  });

  describe('Reports & Dashboard Telemetry', () => {
    test('GET /api/reports/summary calculates real execution metrics', async () => {
      const res = await request(app).get('/api/reports/summary');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.summary).toBeDefined();
      expect(res.body.summary.passPercentage).toBeDefined();
    });

    test('GET /api/reports/export-csv returns valid CSV format', async () => {
      const res = await request(app).get('/api/reports/export-csv');
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('text/csv');
      expect(res.text).toContain('Execution ID,Date,Project');
    });

    test('GET /api/dashboard/stats returns real counts', async () => {
      const res = await request(app).get('/api/dashboard/stats');
      expect(res.status).toBe(200);
      expect(res.body.stats.totalProjects).toBeGreaterThan(0);
      expect(res.body.stats.totalTestCases).toBeGreaterThan(0);
    });
  });
});
