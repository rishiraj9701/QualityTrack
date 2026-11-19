import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { router } from './routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors({ origin: '*' }));
app.use(express.json());

// Routes
app.use('/api', router);

// Root greeting / info
app.get('/', (req, res) => {
  res.json({
    name: 'QualityTrack Simulated Target REST API',
    description: 'Isolated testbed API simulating User Management microservice for QA testing',
    endpoints: [
      'GET    /api/health',
      'GET    /api/users',
      'GET    /api/users/:id',
      'POST   /api/users',
      'PUT    /api/users/:id',
      'PATCH  /api/users/:id',
      'DELETE /api/users/:id',
      'POST   /api/users/reset',
    ],
  });
});

export const server = app.listen(PORT, () => {
  console.log(`[Demo API] Simulated User Management API running on http://localhost:${PORT}`);
});

export default app;
