import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

import { authenticate } from './middleware/auth';
import { authRouter } from './routes/authRoutes';
import { projectRouter } from './routes/projectRoutes';
import { endpointRouter } from './routes/endpointRoutes';
import { testSuiteRouter } from './routes/testSuiteRoutes';
import { testCaseRouter } from './routes/testCaseRoutes';
import { executionRouter } from './routes/executionRoutes';
import { proxyRouter } from './routes/proxyRoutes';
import { bugRouter } from './routes/bugRoutes';
import { reportRouter } from './routes/reportRoutes';
import { dashboardRouter } from './routes/dashboardRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Security & Parsing Middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Global Authentication Context
app.use(authenticate);

// API Health Check
app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'UP',
    platform: 'QualityTrack Core Backend',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    database: 'Connected',
  });
});

// Mount Routes
app.use('/api/auth', authRouter);
app.use('/api/projects', projectRouter);
app.use('/api/endpoints', endpointRouter);
app.use('/api/test-suites', testSuiteRouter);
app.use('/api/test-cases', testCaseRouter);
app.use('/api/executions', executionRouter);
app.use('/api/proxy', proxyRouter);
app.use('/api/bugs', bugRouter);
app.use('/api/reports', reportRouter);
app.use('/api/dashboard', dashboardRouter);

// Centralized 404 handler for API routes
app.use('/api/*', (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: `API route '${req.method} ${req.originalUrl}' not found.`,
  });
});

// Centralized Global Error Handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('[QualityTrack Backend Error]:', err);
  const status = err.status || 500;
  res.status(status).json({
    success: false,
    message: err.message || 'An unexpected internal server error occurred.',
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
});

export const server = app.listen(PORT, () => {
  console.log(`[QualityTrack] Core Backend listening on http://localhost:${PORT}`);
});

export default app;
