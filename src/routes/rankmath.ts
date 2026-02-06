import { Router, Request, Response } from 'express';
import { RankMathClient } from '../services/rankmath';

const router = Router();

function getClient(): RankMathClient {
  const siteUrl = process.env.WP_SITE_URL;
  const apiKey = process.env.RANKMATH_API_KEY;
  if (!siteUrl || !apiKey) {
    throw new Error('WP_SITE_URL and RANKMATH_API_KEY must be configured');
  }
  return new RankMathClient({ siteUrl, apiKey });
}

router.get('/posts', async (req: Request, res: Response) => {
  try {
    const client = getClient();
    const perPage = Number(req.query.perPage) || 10;
    const page = Number(req.query.page) || 1;
    const posts = await client.getPosts(perPage, page);
    res.json(posts);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    const status = message.includes('must be configured') ? 503 : 502;
    res.status(status).json({ error: message });
  }
});

router.get('/pages', async (req: Request, res: Response) => {
  try {
    const client = getClient();
    const perPage = Number(req.query.perPage) || 10;
    const page = Number(req.query.page) || 1;
    const pages = await client.getPages(perPage, page);
    res.json(pages);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    const status = message.includes('must be configured') ? 503 : 502;
    res.status(status).json({ error: message });
  }
});

router.get('/posts/:postId/seo', async (req: Request, res: Response) => {
  try {
    const client = getClient();
    const seoMeta = await client.getPostSeoMeta(Number(req.params.postId));
    res.json(seoMeta);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    const status = message.includes('must be configured') ? 503 : 502;
    res.status(status).json({ error: message });
  }
});

router.put('/posts/:postId/seo', async (req: Request, res: Response) => {
  try {
    const client = getClient();
    const result = await client.updatePostSeoMeta(Number(req.params.postId), req.body);
    res.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    const status = message.includes('must be configured') ? 503 : 502;
    res.status(status).json({ error: message });
  }
});

router.put('/pages/:pageId/seo', async (req: Request, res: Response) => {
  try {
    const client = getClient();
    const result = await client.updatePageSeoMeta(Number(req.params.pageId), req.body);
    res.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    const status = message.includes('must be configured') ? 503 : 502;
    res.status(status).json({ error: message });
  }
});

router.get('/health', async (_req: Request, res: Response) => {
  try {
    const client = getClient();
    const health = await client.getSiteHealth();
    res.json(health);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    const status = message.includes('must be configured') ? 503 : 502;
    res.status(status).json({ error: message });
  }
});

export default router;
