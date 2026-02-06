import express from 'express';
import rateLimit from 'express-rate-limit';
import uploadRouter from './routes/upload';
import serankingRouter from './routes/seranking';
import rankmathRouter from './routes/rankmath';
import { apiKeyAuth } from './middleware/auth';

export function createApp() {
  const app = express();

  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    message: { error: 'Too many requests, try again later' },
  });

  app.use(limiter);

  app.get('/', (_req, res) => {
    res.json({ message: 'Hello from Babylovesgrowth!' });
  });

  app.use(express.json());

  app.use('/upload', apiKeyAuth, uploadRouter);
  app.use('/seranking', apiKeyAuth, serankingRouter);
  app.use('/rankmath', apiKeyAuth, rankmathRouter);

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
