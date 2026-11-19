import { Router, Response } from 'express';
import { prisma } from '../prisma/client';
import { AuthRequest } from '../middleware/auth';

export const projectRouter = Router();

/**
 * GET /api/projects - List all projects with summarized stats
 */
projectRouter.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const projects = await prisma.project.findMany({
      include: {
        environments: true,
        _count: {
          select: {
            endpoints: true,
            testCases: true,
            testSuites: true,
            testRuns: true,
            bugReports: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    res.status(200).json({ success: true, projects });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * GET /api/projects/:id - Get project details with environments and stats
 */
projectRouter.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        environments: true,
        endpoints: {
          orderBy: { createdAt: 'desc' },
        },
        testSuites: {
          include: {
            _count: { select: { testCases: true } },
          },
        },
        _count: {
          select: {
            endpoints: true,
            testCases: true,
            testRuns: true,
            bugReports: true,
          },
        },
      },
    });

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    res.status(200).json({ success: true, project });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * POST /api/projects - Create a new project with default environments
 */
projectRouter.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const { name, description, baseUrl = 'http://localhost:5001', currentEnv = 'Development' } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({ success: false, message: 'Project name is required' });
    }

    const project = await prisma.project.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        baseUrl: baseUrl.trim(),
        currentEnv,
        userId: req.user?.id || null,
        environments: {
          create: [
            {
              name: 'Development',
              baseUrl: baseUrl.trim(),
              variables: JSON.stringify([
                { key: 'baseUrl', value: baseUrl.trim(), isSecret: false, enabled: true },
              ]),
            },
            {
              name: 'Staging',
              baseUrl: 'https://staging-api.example.com',
              variables: JSON.stringify([
                { key: 'baseUrl', value: 'https://staging-api.example.com', isSecret: false, enabled: true },
              ]),
            },
            {
              name: 'Production',
              baseUrl: 'https://api.example.com',
              variables: JSON.stringify([
                { key: 'baseUrl', value: 'https://api.example.com', isSecret: false, enabled: true },
              ]),
            },
          ],
        },
      },
      include: { environments: true },
    });

    res.status(201).json({ success: true, project });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * PUT /api/projects/:id - Update project metadata
 */
projectRouter.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, baseUrl, currentEnv } = req.body;

    const project = await prisma.project.update({
      where: { id },
      data: {
        name: name?.trim(),
        description: description !== undefined ? description?.trim() : undefined,
        baseUrl: baseUrl?.trim(),
        currentEnv,
      },
      include: { environments: true },
    });

    res.status(200).json({ success: true, project });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * DELETE /api/projects/:id - Delete a project and cascading data
 */
projectRouter.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.project.delete({ where: { id } });
    res.status(200).json({ success: true, message: 'Project deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * PUT /api/projects/:id/environments/:envName - Update an environment's baseUrl and variables
 */
projectRouter.put('/:id/environments/:envName', async (req: AuthRequest, res: Response) => {
  try {
    const { id, envName } = req.params;
    const { baseUrl, variables } = req.body;

    const env = await prisma.environment.upsert({
      where: { projectId_name: { projectId: id, name: envName } },
      update: {
        baseUrl: baseUrl !== undefined ? baseUrl : undefined,
        variables: variables !== undefined ? (typeof variables === 'string' ? variables : JSON.stringify(variables)) : undefined,
      },
      create: {
        projectId: id,
        name: envName,
        baseUrl: baseUrl || 'http://localhost:5001',
        variables: typeof variables === 'string' ? variables : JSON.stringify(variables || []),
      },
    });

    res.status(200).json({ success: true, environment: env });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});
