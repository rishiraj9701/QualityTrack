import { Router, Request, Response } from 'express';
import { prisma } from '../prisma/client';

export const testCaseRouter = Router();

/**
 * GET /api/test-cases
 * Supports filtering by projectId, suiteId, endpointId, category, priority, and search
 */
testCaseRouter.get('/', async (req: Request, res: Response) => {
  try {
    const { projectId, suiteId, endpointId, category, priority, search } = req.query;

    const where: any = {};
    if (projectId) where.projectId = String(projectId);
    if (suiteId) where.suiteId = String(suiteId);
    if (endpointId) where.endpointId = String(endpointId);
    if (category) where.category = String(category);
    if (priority) where.priority = String(priority);

    if (search && typeof search === 'string') {
      const q = search.trim();
      where.OR = [
        { name: { contains: q } },
        { testCaseId: { contains: q } },
        { description: { contains: q } },
        { path: { contains: q } },
      ];
    }

    const testCases = await prisma.testCase.findMany({
      where,
      include: {
        assertions: true,
        suite: { select: { id: true, name: true } },
        endpoint: { select: { id: true, name: true, method: true, path: true } },
        testResults: {
          take: 1,
          orderBy: { createdAt: 'desc' },
          select: { id: true, status: true, responseTimeMs: true, statusCode: true, createdAt: true },
        },
      },
      orderBy: { testCaseId: 'asc' },
    });

    res.status(200).json({ success: true, testCases });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * GET /api/test-cases/:id
 */
testCaseRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const testCase = await prisma.testCase.findUnique({
      where: { id },
      include: {
        assertions: true,
        suite: true,
        endpoint: true,
        testResults: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: { testRun: true },
        },
        bugReports: true,
      },
    });

    if (!testCase) {
      return res.status(404).json({ success: false, message: 'Test case not found' });
    }

    res.status(200).json({ success: true, testCase });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * POST /api/test-cases - Create Test Case with assertions
 */
testCaseRouter.post('/', async (req: Request, res: Response) => {
  try {
    const {
      projectId,
      suiteId,
      endpointId,
      testCaseId,
      name,
      description,
      method = 'GET',
      path,
      headers,
      queryParams,
      body,
      authType = 'none',
      authConfig,
      expectedStatus = 200,
      category = 'Positive Testing',
      priority = 'Medium',
      assertions = [],
    } = req.body;

    if (!projectId || !name || !path) {
      return res.status(400).json({ success: false, message: 'projectId, name, and path are required' });
    }

    // Generate testCaseId if not provided (e.g. TC011)
    let tcId = testCaseId;
    if (!tcId) {
      const count = await prisma.testCase.count({ where: { projectId } });
      tcId = `TC${String(count + 1).padStart(3, '0')}`;
    }

    const testCase = await prisma.testCase.create({
      data: {
        testCaseId: tcId,
        projectId,
        suiteId: suiteId || null,
        endpointId: endpointId || null,
        name: name.trim(),
        description: description?.trim() || null,
        method: method.toUpperCase(),
        path: path.trim(),
        headers: headers ? (typeof headers === 'string' ? headers : JSON.stringify(headers)) : null,
        queryParams: queryParams ? (typeof queryParams === 'string' ? queryParams : JSON.stringify(queryParams)) : null,
        body: body ? (typeof body === 'string' ? body : JSON.stringify(body)) : null,
        authType,
        authConfig: authConfig ? (typeof authConfig === 'string' ? authConfig : JSON.stringify(authConfig)) : null,
        expectedStatus: parseInt(String(expectedStatus), 10) || 200,
        category,
        priority,
        assertions: {
          create: assertions.map((a: any) => ({
            type: a.type,
            target: a.target || null,
            operator: a.operator,
            expectedValue: String(a.expectedValue),
          })),
        },
      },
      include: {
        assertions: true,
        suite: true,
        endpoint: true,
      },
    });

    res.status(201).json({ success: true, testCase });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * PUT /api/test-cases/:id - Update Test Case & sync assertions
 */
testCaseRouter.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      suiteId,
      endpointId,
      testCaseId,
      name,
      description,
      method,
      path,
      headers,
      queryParams,
      body,
      authType,
      authConfig,
      expectedStatus,
      category,
      priority,
      assertions,
    } = req.body;

    // Use transaction to update test case and replace assertions cleanly
    const updated = await prisma.$transaction(async (tx) => {
      if (assertions && Array.isArray(assertions)) {
        // Delete old assertions
        await tx.assertion.deleteMany({ where: { testCaseId: id } });
        // Create new assertions
        if (assertions.length > 0) {
          await tx.assertion.createMany({
            data: assertions.map((a: any) => ({
              testCaseId: id,
              type: a.type,
              target: a.target || null,
              operator: a.operator,
              expectedValue: String(a.expectedValue),
            })),
          });
        }
      }

      return tx.testCase.update({
        where: { id },
        data: {
          testCaseId: testCaseId !== undefined ? testCaseId : undefined,
          suiteId: suiteId !== undefined ? suiteId || null : undefined,
          endpointId: endpointId !== undefined ? endpointId || null : undefined,
          name: name?.trim(),
          description: description !== undefined ? description?.trim() : undefined,
          method: method ? method.toUpperCase() : undefined,
          path: path?.trim(),
          headers: headers !== undefined ? (typeof headers === 'string' ? headers : JSON.stringify(headers)) : undefined,
          queryParams: queryParams !== undefined ? (typeof queryParams === 'string' ? queryParams : JSON.stringify(queryParams)) : undefined,
          body: body !== undefined ? (typeof body === 'string' ? body : JSON.stringify(body)) : undefined,
          authType: authType !== undefined ? authType : undefined,
          authConfig: authConfig !== undefined ? (typeof authConfig === 'string' ? authConfig : JSON.stringify(authConfig)) : undefined,
          expectedStatus: expectedStatus !== undefined ? parseInt(String(expectedStatus), 10) : undefined,
          category: category !== undefined ? category : undefined,
          priority: priority !== undefined ? priority : undefined,
        },
        include: {
          assertions: true,
          suite: true,
          endpoint: true,
        },
      });
    });

    res.status(200).json({ success: true, testCase: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * POST /api/test-cases/:id/duplicate - Duplicate Test Case
 */
testCaseRouter.post('/:id/duplicate', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const source = await prisma.testCase.findUnique({
      where: { id },
      include: { assertions: true },
    });

    if (!source) {
      return res.status(404).json({ success: false, message: 'Source test case not found' });
    }

    const count = await prisma.testCase.count({ where: { projectId: source.projectId } });
    const newTcId = `TC${String(count + 1).padStart(3, '0')}`;

    const duplicate = await prisma.testCase.create({
      data: {
        testCaseId: newTcId,
        projectId: source.projectId,
        suiteId: source.suiteId,
        endpointId: source.endpointId,
        name: `${source.name} (Copy)`,
        description: source.description,
        method: source.method,
        path: source.path,
        headers: source.headers,
        queryParams: source.queryParams,
        body: source.body,
        authType: source.authType,
        authConfig: source.authConfig,
        expectedStatus: source.expectedStatus,
        category: source.category,
        priority: source.priority,
        assertions: {
          create: source.assertions.map((a) => ({
            type: a.type,
            target: a.target,
            operator: a.operator,
            expectedValue: a.expectedValue,
          })),
        },
      },
      include: {
        assertions: true,
        suite: true,
        endpoint: true,
      },
    });

    res.status(201).json({ success: true, testCase: duplicate });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * DELETE /api/test-cases/:id
 */
testCaseRouter.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.testCase.delete({ where: { id } });
    res.status(200).json({ success: true, message: 'Test case deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});
