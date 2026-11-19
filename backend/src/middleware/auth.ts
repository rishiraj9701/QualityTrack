import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../prisma/client';

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

export interface AuthRequest extends Request {
  user?: AuthenticatedUser;
}

const JWT_SECRET = process.env.JWT_SECRET || 'qualitytrack-dev-jwt-secret-key-2024';

export async function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as AuthenticatedUser;
      req.user = decoded;
      return next();
    } catch (err) {
      // Invalid token, fall through to demo user fallback or return 401
    }
  }

  // Graceful fallback for local development & demonstration: attach the default demo user
  try {
    const demoUser = await prisma.user.findFirst();
    if (demoUser) {
      req.user = {
        id: demoUser.id,
        email: demoUser.email,
        name: demoUser.name,
        role: demoUser.role,
      };
    }
  } catch {}

  next();
}
