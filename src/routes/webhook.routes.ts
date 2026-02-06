/**
 * Webhook Router - Receives posts from BabyLoveGrowth.ai
 */

import { Router, Request, Response } from 'express';
import { BabyLoveGrowthWebhookService } from '../services/babylovegrowth-webhook.service';

export function createWebhookRouter(webhookService: BabyLoveGrowthWebhookService): Router {
  const router = Router();

  /**
   * POST /api/webhook/babylovegrowth
   * Receive blog posts from babylovesgrowth.ai
   *
   * Expected payload:
   * {
   *   "title": "Blog Post Title",
   *   "slug": "blog-post-slug",
   *   "content_html": "<h1>Content</h1>",
   *   "metaDescription": "Description",
   *   "heroImageUrl": "https://example.com/image.jpg",
   *   "status": "publish",
   *   "tags": ["tag1", "tag2"]
   * }
   */
  router.post('/babylovegrowth', async (req: Request, res: Response) => {
    try {
      console.log('🔔 Webhook triggered from BabyLoveGrowth.ai');

      // Get API key from Authorization header
      const authHeader = req.headers.authorization;
      const apiKey = process.env.WEBHOOK_API_KEY;

      // Validate API key
      if (!authHeader || !apiKey) {
        console.warn('⚠️  Missing API key in webhook request');
        return res.status(401).json({
          success: false,
          error: 'Unauthorized: Missing API key',
        });
      }

      // Check Bearer token
      const token = authHeader.replace('Bearer ', '');
      if (token !== apiKey) {
        console.warn('⚠️  Invalid API key in webhook request');
        return res.status(401).json({
          success: false,
          error: 'Unauthorized: Invalid API key',
        });
      }

      // Process webhook
      const result = await webhookService.processWebhook(req.body);

      if (!result.success) {
        return res.status(400).json({
          success: false,
          error: result.error,
        });
      }

      res.json({
        success: true,
        message: 'Blog post published successfully',
        postId: result.postId,
      });
    } catch (error) {
      console.error('❌ Webhook processing error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      });
    }
  });

  /**
   * GET /api/webhook/test
   * Test endpoint to verify webhook is reachable
   */
  router.get('/test', (_req: Request, res: Response) => {
    res.json({
      success: true,
      message: 'Webhook endpoint is active',
      endpoint: '/api/webhook/babylovegrowth',
      method: 'POST',
      authentication: 'Bearer token in Authorization header',
    });
  });

  /**
   * POST /api/webhook/test
   * Test webhook with sample data
   */
  router.post('/test', async (req: Request, res: Response) => {
    try {
      const samplePayload = {
        title: req.body.title || 'Test Blog Post från BabyLoveGrowth',
        slug: 'test-blog-post',
        content_html: req.body.content_html || '<h1>Test Content</h1><p>Detta är ett test-inlägg från babylovesgrowth.ai webhook integration.</p>',
        metaDescription: 'Test blog post för att verifiera webhook integration',
        status: 'draft' as const,
        tags: ['test', 'webhook'],
      };

      const result = await webhookService.processWebhook(samplePayload);

      res.json({
        success: true,
        message: 'Test webhook processed',
        result,
        samplePayload,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Test failed',
      });
    }
  });

  return router;
}
