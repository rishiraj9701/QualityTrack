import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { userStore, DemoUser } from './store';

export const router = Router();

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

/**
 * Health check
 */
router.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'UP',
    service: 'QualityTrack Simulated User Management API',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
  });
});

/**
 * Reset Demo Data
 */
router.post('/users/reset', (req: Request, res: Response) => {
  userStore.reset();
  res.status(200).json({
    success: true,
    message: 'Demo user store successfully reset to default state.',
    userCount: userStore.getAll().length,
  });
});

/**
 * GET /api/users - List users with filtering & pagination
 */
router.get('/users', (req: Request, res: Response) => {
  const { search, role, status, page = '1', limit = '10' } = req.query;

  let users = userStore.getAll();

  if (search && typeof search === 'string') {
    const q = search.toLowerCase();
    users = users.filter((u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
  }

  if (role && typeof role === 'string') {
    users = users.filter((u) => u.role.toLowerCase() === role.toLowerCase());
  }

  if (status && typeof status === 'string') {
    users = users.filter((u) => u.status.toUpperCase() === status.toUpperCase());
  }

  const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
  const pageSize = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 10));
  const total = users.length;
  const startIndex = (pageNum - 1) * pageSize;
  const paginated = users.slice(startIndex, startIndex + pageSize);

  res.status(200).json({
    success: true,
    total,
    page: pageNum,
    limit: pageSize,
    totalPages: Math.ceil(total / pageSize),
    users: paginated,
  });
});

/**
 * GET /api/users/:id - Get single user by ID
 */
router.get('/users/:id', (req: Request, res: Response) => {
  const { id } = req.params;

  // Boundary/Format validation: ID shouldn't be too long or contain illegal chars
  if (!id || id.length > 50) {
    return res.status(400).json({
      success: false,
      error: 'Invalid User ID',
      message: 'User ID format is invalid or exceeds maximum length.',
    });
  }

  const user = userStore.findById(id);
  if (!user) {
    return res.status(404).json({
      success: false,
      error: 'Not Found',
      message: `User with ID '${id}' was not found.`,
    });
  }

  res.status(200).json({
    success: true,
    user,
  });
});

/**
 * POST /api/users - Create/Register new user
 * Covers positive, negative, boundary, edge case scenarios
 */
router.post('/users', (req: Request, res: Response) => {
  const body = req.body;

  // 1. Edge Case: Empty Body
  if (!body || Object.keys(body).length === 0) {
    return res.status(400).json({
      success: false,
      error: 'Bad Request',
      message: 'Request body cannot be empty.',
    });
  }

  const { name, email, password, role = 'Member', status = 'ACTIVE' } = body;

  // 2. Negative Scenario: Missing required fields
  if (!name || typeof name !== 'string' || name.trim() === '') {
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      field: 'name',
      message: "Field 'name' is required and must be a non-empty string.",
    });
  }

  // 3. Boundary Scenario: Name length check
  if (name.length > 100) {
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      field: 'name',
      message: 'Name exceeds maximum length of 100 characters.',
    });
  }

  if (name.trim().length < 2) {
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      field: 'name',
      message: 'Name must be at least 2 characters.',
    });
  }

  // 4. Negative Scenario: Missing email
  if (!email || typeof email !== 'string' || email.trim() === '') {
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      field: 'email',
      message: "Field 'email' is required.",
    });
  }

  // 5. Negative Scenario: Invalid email format
  if (!EMAIL_REGEX.test(email.trim())) {
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      field: 'email',
      message: `Invalid email address format: '${email}'. Must follow standard user@domain.com format.`,
    });
  }

  // 6. Negative Scenario: Duplicate email rejection (409 Conflict)
  const existing = userStore.findByEmail(email.trim());
  if (existing) {
    return res.status(409).json({
      success: false,
      error: 'Conflict',
      field: 'email',
      message: `User with email '${email}' already exists in the system.`,
    });
  }

  // 7. Negative / Boundary Scenario: Password checks
  if (!password || typeof password !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      field: 'password',
      message: "Field 'password' is required.",
    });
  }

  if (password.length < 8) {
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      field: 'password',
      message: 'Password must be at least 8 characters long.',
    });
  }

  if (password.length > 100) {
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      field: 'password',
      message: 'Password exceeds maximum length of 100 characters.',
    });
  }

  // Valid User Creation (Positive Scenario)
  const newUser: DemoUser = {
    id: `usr_${uuidv4().substring(0, 8)}`,
    name: name.trim(),
    email: email.trim().toLowerCase(),
    role: String(role),
    status: status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  userStore.add(newUser);

  return res.status(201).json({
    success: true,
    message: 'User created successfully.',
    user: newUser,
  });
});

/**
 * PUT /api/users/:id - Full Update User
 */
router.put('/users/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, email, role, status } = req.body;

  const existing = userStore.findById(id);
  if (!existing) {
    return res.status(404).json({
      success: false,
      error: 'Not Found',
      message: `Cannot update non-existent user with ID '${id}'.`,
    });
  }

  if (!name || !email) {
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      message: "Full update requires both 'name' and 'email' fields.",
    });
  }

  if (!EMAIL_REGEX.test(email)) {
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      message: 'Invalid email format.',
    });
  }

  // Check email conflict with another user
  const otherWithEmail = userStore.findByEmail(email);
  if (otherWithEmail && otherWithEmail.id !== id) {
    return res.status(409).json({
      success: false,
      error: 'Conflict',
      message: `Email '${email}' is already in use by another user.`,
    });
  }

  const updated = userStore.update(id, {
    name: name.trim(),
    email: email.trim().toLowerCase(),
    role: role || existing.role,
    status: status || existing.status,
  });

  res.status(200).json({
    success: true,
    message: 'User fully updated.',
    user: updated,
  });
});

/**
 * PATCH /api/users/:id - Partial Update User
 */
router.patch('/users/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const updates = req.body;

  const existing = userStore.findById(id);
  if (!existing) {
    return res.status(404).json({
      success: false,
      error: 'Not Found',
      message: `Cannot patch user with ID '${id}'.`,
    });
  }

  if (updates.email) {
    if (!EMAIL_REGEX.test(updates.email)) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'Invalid email format provided in patch.',
      });
    }

    const other = userStore.findByEmail(updates.email);
    if (other && other.id !== id) {
      return res.status(409).json({
        success: false,
        error: 'Conflict',
        message: `Email '${updates.email}' is already in use by another user.`,
      });
    }
  }

  const updated = userStore.update(id, updates);

  res.status(200).json({
    success: true,
    message: 'User partially updated.',
    user: updated,
  });
});

/**
 * DELETE /api/users/:id - Delete User
 */
router.delete('/users/:id', (req: Request, res: Response) => {
  const { id } = req.params;

  const existing = userStore.findById(id);
  if (!existing) {
    return res.status(404).json({
      success: false,
      error: 'Not Found',
      message: `Cannot delete non-existent user with ID '${id}'.`,
    });
  }

  userStore.delete(id);

  res.status(200).json({
    success: true,
    message: `User '${existing.name}' (${id}) deleted successfully.`,
    deletedUser: existing,
  });
});
