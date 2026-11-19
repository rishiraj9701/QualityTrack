import { Router, Request, Response } from 'express';
import { prisma } from '../prisma/client';

export const bugRouter = Router();

/**
 * GET /api/bugs - List bugs with filtering by project, status, severity, priority, search
 */
bugRouter.get('/', async (req: Request, res: Response) => {
  try {
    const { projectId, status, severity, priority, search } = req.query;

    const where: any = {};
    if (projectId) where.projectId = String(projectId);
    if (status) where.status = String(status);
    if (severity) where.severity = String(severity);
    if (priority) where.priority = String(priority);

    if (search && typeof search === 'string') {
      const q = search.trim();
      where.OR = [
        { bugId: { contains: q } },
        { title: { contains: q } },
        { description: { contains: q } },
      ];
    }

    const bugs = await prisma.bugReport.findMany({
      where,
      include: {
        project: { select: { id: true, name: true } },
        endpoint: { select: { id: true, name: true, method: true, path: true } },
        testCase: { select: { id: true, testCaseId: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({ success: true, bugs });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * GET /api/bugs/:id - Get bug details
 */
bugRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const bug = await prisma.bugReport.findUnique({
      where: { id },
      include: {
        project: true,
        endpoint: true,
        testCase: true,
        testResult: true,
      },
    });

    if (!bug) {
      return res.status(404).json({ success: false, message: 'Bug report not found' });
    }

    res.status(200).json({ success: true, bug });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * POST /api/bugs - Create bug report (manually or prefilled from failed test result)
 */
bugRouter.post('/', async (req: Request, res: Response) => {
  try {
    const {
      projectId,
      endpointId,
      testCaseId,
      testResultId,
      title,
      description,
      stepsToReproduce,
      expectedResult,
      actualResult,
      severity = 'Medium',
      priority = 'Medium',
      status = 'Open',
    } = req.body;

    if (!projectId || !title || !description) {
      return res.status(400).json({
        success: false,
        message: 'projectId, title, and description are required',
      });
    }

    // Generate consecutive BUG-xxx ID
    const count = await prisma.bugReport.count();
    const bugId = `BUG-${String(count + 1).padStart(3, '0')}`;

    const bug = await prisma.bugReport.create({
      data: {
        bugId,
        projectId,
        endpointId: endpointId || null,
        testCaseId: testCaseId || null,
        testResultId: testResultId || null,
        title: title.trim(),
        description: description.trim(),
        stepsToReproduce: stepsToReproduce?.trim() || '',
        expectedResult: expectedResult?.trim() || '',
        actualResult: actualResult?.trim() || '',
        severity,
        priority,
        status,
      },
      include: {
        project: true,
        endpoint: true,
        testCase: true,
      },
    });

    res.status(201).json({ success: true, bug });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * PUT /api/bugs/:id - Update bug status or details
 */
bugRouter.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      stepsToReproduce,
      expectedResult,
      actualResult,
      severity,
      priority,
      status,
      endpointId,
    } = req.body;

    const bug = await prisma.bugReport.update({
      where: { id },
      data: {
        title: title?.trim(),
        description: description?.trim(),
        stepsToReproduce: stepsToReproduce !== undefined ? stepsToReproduce.trim() : undefined,
        expectedResult: expectedResult !== undefined ? expectedResult.trim() : undefined,
        actualResult: actualResult !== undefined ? actualResult.trim() : undefined,
        severity,
        priority,
        status,
        endpointId: endpointId !== undefined ? endpointId || null : undefined,
      },
      include: {
        project: true,
        endpoint: true,
        testCase: true,
      },
    });

    res.status(200).json({ success: true, bug });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * DELETE /api/bugs/:id
 */
bugRouter.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.bugReport.delete({ where: { id } });
    res.status(200).json({ success: true, message: 'Bug report deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});
