import { Router, Response } from 'express';
import { prisma } from '../prisma/client';
import { AuthRequest } from '../middleware/auth';
import { executeTestRun } from '../services/executionEngine';

export const executionRouter = Router();

/**
 * POST /api/executions/run-single - Execute single test case
 */
executionRouter.post('/run-single', async (req: AuthRequest, res: Response) => {
  try {
    const { testCaseId, projectId, environmentName } = req.body;

    if (!testCaseId) {
      return res.status(400).json({ success: false, message: 'testCaseId is required' });
    }

    // Lookup testCase to get projectId if not supplied
    let projId = projectId;
    if (!projId) {
      const tc = await prisma.testCase.findUnique({
        where: { id: testCaseId },
        select: { projectId: true },
      });
      if (!tc) return res.status(404).json({ success: false, message: 'Test Case not found' });
      projId = tc.projectId;
    }

    const testRun = await executeTestRun({
      projectId: projId,
      testCaseIds: [testCaseId],
      environmentName,
      triggeredBy: req.user?.name || 'Manual Run',
    });

    res.status(200).json({ success: true, testRun });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * POST /api/executions/run-suite - Execute test suite
 */
executionRouter.post('/run-suite', async (req: AuthRequest, res: Response) => {
  try {
    const { suiteId, projectId, environmentName } = req.body;

    if (!suiteId) {
      return res.status(400).json({ success: false, message: 'suiteId is required' });
    }

    let projId = projectId;
    if (!projId) {
      const suite = await prisma.testSuite.findUnique({
        where: { id: suiteId },
        select: { projectId: true },
      });
      if (!suite) return res.status(404).json({ success: false, message: 'Test Suite not found' });
      projId = suite.projectId;
    }

    const testRun = await executeTestRun({
      projectId: projId,
      suiteId,
      environmentName,
      triggeredBy: req.user?.name || 'Manual Run',
    });

    res.status(200).json({ success: true, testRun });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * POST /api/executions/run-project - Execute all tests in project
 */
executionRouter.post('/run-project', async (req: AuthRequest, res: Response) => {
  try {
    const { projectId, environmentName } = req.body;

    if (!projectId) {
      return res.status(400).json({ success: false, message: 'projectId is required' });
    }

    const testRun = await executeTestRun({
      projectId,
      environmentName,
      triggeredBy: req.user?.name || 'Automated Batch',
    });

    res.status(200).json({ success: true, testRun });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * GET /api/executions/runs - List test runs
 */
executionRouter.get('/runs', async (req: AuthRequest, res: Response) => {
  try {
    const { projectId, suiteId, limit = '20', page = '1' } = req.query;

    const where: any = {};
    if (projectId) where.projectId = String(projectId);
    if (suiteId) where.suiteId = String(suiteId);

    const take = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 20));
    const skip = (Math.max(1, parseInt(page as string, 10) || 1) - 1) * take;

    const [total, testRuns] = await Promise.all([
      prisma.testRun.count({ where }),
      prisma.testRun.findMany({
        where,
        take,
        skip,
        orderBy: { createdAt: 'desc' },
        include: {
          project: { select: { id: true, name: true } },
          suite: { select: { id: true, name: true } },
          _count: { select: { testResults: true } },
        },
      }),
    ]);

    res.status(200).json({
      success: true,
      total,
      page: parseInt(page as string, 10) || 1,
      limit: take,
      testRuns,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * GET /api/executions/runs/:id - Get full run details with all test results
 */
executionRouter.get('/runs/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const testRun = await prisma.testRun.findUnique({
      where: { id },
      include: {
        project: true,
        suite: true,
        testResults: {
          include: {
            testCase: {
              include: {
                endpoint: true,
              },
            },
            bugReports: true,
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!testRun) {
      return res.status(404).json({ success: false, message: 'Test Run not found' });
    }

    res.status(200).json({ success: true, testRun });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * GET /api/executions/results/:id - Get single test result
 */
executionRouter.get('/results/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const result = await prisma.testResult.findUnique({
      where: { id },
      include: {
        testCase: {
          include: {
            endpoint: true,
            project: true,
          },
        },
        testRun: true,
        bugReports: true,
      },
    });

    if (!result) {
      return res.status(404).json({ success: false, message: 'Test Result not found' });
    }

    res.status(200).json({ success: true, testResult: result });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});
