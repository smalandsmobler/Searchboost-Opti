import { Request, Response, NextFunction } from 'express';

export function apiKeyAuth(req: Request, res: Response, next: NextFunction) {
  const apiKey = process.env.API_KEY;

  // Skip auth if no API_KEY is configured
  if (!apiKey) {
    next();
    return;
  }

  const provided = req.headers['x-api-key'] || req.query.apiKey;

  if (provided !== apiKey) {
    res.status(401).json({ error: 'Invalid or missing API key' });
    return;
  }

  next();
}
