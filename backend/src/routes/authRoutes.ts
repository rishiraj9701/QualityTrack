import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../prisma/client';
import { AuthRequest } from '../middleware/auth';

export const authRouter = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'qualitytrack-dev-jwt-secret-key-2024';

/**
 * POST /api/auth/register
 */
authRouter.post('/register', async (req: Request, res: Response) => {
  const { email, name, password } = req.body;

  if (!email || !password || !name) {
    return res.status(400).json({ success: false, message: 'Name, email, and password are required' });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return res.status(409).json({ success: false, message: 'User with this email already exists' });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      email,
      name,
      passwordHash,
      role: 'QA_ENGINEER',
    },
  });

  const token = jwt.sign(
    { id: user.id, email: user.email, name: user.name, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.status(201).json({
    success: true,
    token,
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
  });
});

/**
 * POST /api/auth/login
 */
authRouter.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required' });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return res.status(401).json({ success: false, message: 'Invalid credentials' });
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    return res.status(401).json({ success: false, message: 'Invalid credentials' });
  }

  const token = jwt.sign(
    { id: user.id, email: user.email, name: user.name, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.status(200).json({
    success: true,
    token,
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
  });
});

/**
 * GET /api/auth/me
 */
authRouter.get('/me', async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Not authenticated' });
  }

  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: { id: true, email: true, name: true, role: true, createdAt: true },
  });

  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  res.status(200).json({ success: true, user });
});
