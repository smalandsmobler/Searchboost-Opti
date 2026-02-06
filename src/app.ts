import express from 'express';
import uploadRouter from './routes/upload';

export function createApp() {
  const app = express();

  app.get('/', (_req, res) => {
    res.json({ message: 'Hello from Babylovesgrowth!' });
  });

  app.use('/upload', uploadRouter);

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
