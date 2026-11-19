import { Router, Request, Response } from 'express';
import { prisma } from '../prisma/client';

export const testSuiteRouter = Router();

/**
 * GET /api/test-suites
 */
testSuiteRouter.get('/', async (req: Request, res: Response) => {
  try {
    const { projectId } = req.query;
    const where: any = {};
    if (projectId && typeof projectId === 'string') {
      where.projectId = projectId;
    }

    const suites = await prisma.testSuite.findMany({
      where,
      include: {
        testCases: {
          select: {
            id: true,
            testCaseId: true,
            name: true,
            method: true,
            path: true,
            category: true,
            priority: true,
            expectedStatus: true,
          },
        },
        _count: {
          select: { testCases: true, testRuns: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    res.status(200).json({ success: true, testSuites: suites });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * GET /api/test-suites/:id
 */
testSuiteRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const suite = await prisma.testSuite.findUnique({
      where: { id },
      include: {
        testCases: {
          include: {
            assertions: true,
            endpoint: true,
          },
        },
      },
    });

    if (!suite) {
      return res.status(404).json({ success: false, message: 'Test Suite not found' });
    }

    res.status(200).json({ success: true, testSuite: suite });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * POST /api/test-suites
 */
testSuiteRouter.post('/', async (req: Request, res: Response) => {
  try {
    const { projectId, name, description } = req.body;

    if (!projectId || !name) {
      return res.status(400).json({ success: false, message: 'projectId and name are required' });
    }

    const suite = await prisma.testSuite.create({
      data: {
        projectId,
        name: name.trim(),
        description: description?.trim() || null,
      },
    });

    res.status(201).json({ success: true, testSuite: suite });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * PUT /api/test-suites/:id
 */
testSuiteRouter.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    const suite = await prisma.testSuite.update({
      where: { id },
      data: {
        name: name?.trim(),
        description: description !== undefined ? description?.trim() : undefined,
      },
    });

    res.status(200).json({ success: true, testSuite: suite });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * DELETE /api/test-suites/:id
 */
testSuiteRouter.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.testSuite.delete({ where: { id } });
    res.status(200).json({ success: true, message: 'Test Suite deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});
