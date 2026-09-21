import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import env from './config/env.js';
import { getDatabaseStatus } from './config/db.js';
import requirementRoutes from './routes/requirement.routes.js';
import testCaseRoutes from './routes/testCase.routes.js';
import notFound from './middleware/notFound.js';
import errorHandler from './middleware/errorHandler.js';

const app = express();

app.use(helmet());

app.use(
  cors({
    origin: env.clientOrigin,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

if (!env.isProduction) {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

app.get('/api/health', (req, res) => {
  const database = getDatabaseStatus();

  res.status(200).json({
    success: true,
    message: 'API is healthy',
    database,
  });
});

app.use('/api/requirements', requirementRoutes);
app.use('/api/test-cases', testCaseRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
