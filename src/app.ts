import express from 'express';
import path from 'path';
import rateLimit from 'express-rate-limit';
import uploadRouter from './routes/upload';
import serankingRouter from './routes/seranking';
import rankmathRouter from './routes/rankmath';
import googleadsRouter from './routes/googleads';
import socialRouter from './routes/social';
import { apiKeyAuth } from './middleware/auth';

export function createApp() {
  const app = express();

  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    message: { error: 'Too many requests, try again later' },
  });

  app.use(limiter);
  app.use(express.static(path.join(__dirname, 'public')));

  app.get('/api/health', (_req, res) => {
    res.json({ message: 'Searchboost OPTI', status: 'ok' });
  });

  app.use(express.json());

  app.use('/upload', apiKeyAuth, uploadRouter);
  app.use('/seranking', apiKeyAuth, serankingRouter);
  app.use('/rankmath', apiKeyAuth, rankmathRouter);
  app.use('/googleads', apiKeyAuth, googleadsRouter);
  app.use('/social', apiKeyAuth, socialRouter);

  // Error handler for multer errors (Express requires all 4 params)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
      if (err.message.startsWith('File type')) {
        res.status(415).json({ error: err.message });
        return;
      }
      if (err.message === 'File too large') {
        res.status(413).json({ error: 'File exceeds maximum size of 5 MB' });
        return;
      }
      res.status(500).json({ error: 'Internal server error' });
    },
  );

  return app;
}
