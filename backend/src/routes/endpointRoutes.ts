import { Router, Request, Response } from 'express';
import { prisma } from '../prisma/client';

export const endpointRouter = Router();

/**
 * GET /api/endpoints
 */
endpointRouter.get('/', async (req: Request, res: Response) => {
  try {
    const { projectId } = req.query;
    const where: any = {};
    if (projectId && typeof projectId === 'string') {
      where.projectId = projectId;
    }

    const endpoints = await prisma.aPIEndpoint.findMany({
      where,
      include: {
        _count: {
          select: { testCases: true, bugReports: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({ success: true, endpoints });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * GET /api/endpoints/:id
 */
endpointRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const endpoint = await prisma.aPIEndpoint.findUnique({
      where: { id },
      include: {
        testCases: true,
        bugReports: true,
      },
    });

    if (!endpoint) {
      return res.status(404).json({ success: false, message: 'Endpoint not found' });
    }

    res.status(200).json({ success: true, endpoint });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * POST /api/endpoints
 */
endpointRouter.post('/', async (req: Request, res: Response) => {
  try {
    const { projectId, name, method, path, description, headers, bodyTemplate } = req.body;

    if (!projectId || !name || !method || !path) {
      return res.status(400).json({ success: false, message: 'projectId, name, method, and path are required' });
    }

    const endpoint = await prisma.aPIEndpoint.create({
      data: {
        projectId,
        name: name.trim(),
        method: method.toUpperCase(),
        path: path.trim(),
        description: description?.trim() || null,
        headers: headers ? (typeof headers === 'string' ? headers : JSON.stringify(headers)) : null,
        bodyTemplate: bodyTemplate ? (typeof bodyTemplate === 'string' ? bodyTemplate : JSON.stringify(bodyTemplate)) : null,
      },
    });

    res.status(201).json({ success: true, endpoint });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * PUT /api/endpoints/:id
 */
endpointRouter.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, method, path, description, headers, bodyTemplate } = req.body;

    const endpoint = await prisma.aPIEndpoint.update({
      where: { id },
      data: {
        name: name?.trim(),
        method: method ? method.toUpperCase() : undefined,
        path: path?.trim(),
        description: description !== undefined ? description?.trim() : undefined,
        headers: headers !== undefined ? (typeof headers === 'string' ? headers : JSON.stringify(headers)) : undefined,
        bodyTemplate: bodyTemplate !== undefined ? (typeof bodyTemplate === 'string' ? bodyTemplate : JSON.stringify(bodyTemplate)) : undefined,
      },
    });

    res.status(200).json({ success: true, endpoint });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * DELETE /api/endpoints/:id
 */
endpointRouter.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.aPIEndpoint.delete({ where: { id } });
    res.status(200).json({ success: true, message: 'Endpoint deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});
