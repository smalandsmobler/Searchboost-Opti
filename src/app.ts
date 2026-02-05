import express from 'express';
import { AbicartClient } from './services/abicart.client';
import { BlogService } from './services/blog.service';
import { createBlogRouter } from './routes/blog.routes';

export function createApp() {
  const app = express();

  // Middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Health check endpoint
  app.get('/', (_req, res) => {
    res.json({
      message: 'Welcome to Babylovesgrowth API',
      version: '1.0.0',
      endpoints: {
        blog: '/api/blog',
        health: '/health',
      },
    });
  });

  app.get('/health', (_req, res) => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
  });

  // Initialize Abicart client and blog service
  const abicartConfig = {
    apiUrl: process.env.ABICART_API_URL || 'https://api.abicart.se/v1/',
    apiKey: process.env.ABICART_API_KEY || '',
    shopId: process.env.ABICART_SHOP_ID || '',
  };

  if (!abicartConfig.apiKey || !abicartConfig.shopId) {
    // eslint-disable-next-line no-console
    console.warn(
      '⚠️  Warning: Abicart API credentials not configured. Please set ABICART_API_KEY and ABICART_SHOP_ID in .env file.'
    );
  }

  const abicartClient = new AbicartClient(abicartConfig);
  const blogService = new BlogService(abicartClient);
  const baseUrl = process.env.BASE_URL || 'http://localhost:3000';

  // Blog routes
  app.use('/api/blog', createBlogRouter(blogService, baseUrl));

  return app;
}
