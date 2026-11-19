import { Router, Request, Response } from 'express';
import { executeProxyRequest } from '../services/proxyService';

export const proxyRouter = Router();

/**
 * POST /api/proxy/send - Ad-hoc request execution for the Postman-like Request Builder
 */
proxyRouter.post('/send', async (req: Request, res: Response) => {
  try {
    const { method = 'GET', url, headers, params, body, timeoutMs = 10000 } = req.body;

    if (!url) {
      return res.status(400).json({
        success: false,
        message: 'URL is required',
      });
    }

    const result = await executeProxyRequest({
      method,
      url,
      headers,
      params,
      data: body,
      timeoutMs: Math.min(30000, Math.max(1000, Number(timeoutMs) || 10000)),
      allowLocalDemo: true,
    });

    res.status(200).json(result);
  } catch (err: any) {
    res.status(500).json({
      success: false,
      isInfrastructureError: true,
      statusCode: 0,
      statusText: 'INTERNAL_SERVER_ERROR',
      responseTimeMs: 0,
      responseSizeBytes: 0,
      headers: {},
      data: null,
      rawBody: '',
      errorMessage: err.message,
    });
  }
});
