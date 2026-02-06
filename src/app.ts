import express from 'express';
import { AbicartClient } from './services/abicart.client';
import { BlogService } from './services/blog.service';
import { AutoPublisher } from './services/auto-publisher.service';
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

  // Initialize Auto-Publisher
  const autoPublisher = new AutoPublisher(blogService);

  // Start auto-publisher if enabled
  const enableAutoPublish =
    process.env.ENABLE_AUTO_PUBLISH === 'true' ||
    process.env.ENABLE_AUTO_PUBLISH === '1';

  if (enableAutoPublish) {
    const cronSchedule = process.env.PUBLISH_SCHEDULE || '0 9 * * *';
    autoPublisher.start(cronSchedule);
  }

  // Blog routes
  app.use('/api/blog', createBlogRouter(blogService, baseUrl));

  // Auto-publisher management routes
  app.post('/api/publish/now', async (_req, res) => {
    try {
      await autoPublisher.publishNow();
      res.json({
        success: true,
        message: 'Blog post published successfully',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to publish blog post',
      });
    }
  });

  app.get('/api/publish/status', async (_req, res) => {
    try {
      const status = await autoPublisher.getQueueStatus();
      res.json({
        success: true,
        data: status,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to get queue status',
      });
    }
  });

  return app;
}
