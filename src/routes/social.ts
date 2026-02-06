import { Router, Request, Response } from 'express';
import { MetaClient, LinkedInClient } from '../services/social';

const router = Router();

// ---- Facebook / Instagram ----

function getMetaClient(): MetaClient {
  const accessToken = process.env.META_ACCESS_TOKEN;
  const pageId = process.env.META_PAGE_ID;
  if (!accessToken || !pageId) {
    throw new Error('META_ACCESS_TOKEN and META_PAGE_ID must be configured');
  }
  return new MetaClient({ accessToken, pageId });
}

router.get('/facebook/insights', async (req: Request, res: Response) => {
  try {
    const client = getMetaClient();
    const period = (req.query.period as string) || 'day';
    const dateFrom = req.query.from as string | undefined;
    const dateTo = req.query.to as string | undefined;
    const insights = await client.getPageInsights(period, dateFrom, dateTo);
    res.json(insights);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    const status = message.includes('must be configured') ? 503 : 502;
    res.status(status).json({ error: message });
  }
});

router.get('/facebook/posts', async (req: Request, res: Response) => {
  try {
    const client = getMetaClient();
    const limit = Number(req.query.limit) || 10;
    const posts = await client.getPagePosts(limit);
    res.json(posts);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    const status = message.includes('must be configured') ? 503 : 502;
    res.status(status).json({ error: message });
  }
});

router.get('/facebook/posts/:postId/insights', async (req: Request, res: Response) => {
  try {
    const client = getMetaClient();
    const insights = await client.getPostInsights(req.params.postId);
    res.json(insights);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    const status = message.includes('must be configured') ? 503 : 502;
    res.status(status).json({ error: message });
  }
});

router.get('/instagram/account', async (_req: Request, res: Response) => {
  try {
    const client = getMetaClient();
    const account = await client.getInstagramAccount();
    res.json(account);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    const status = message.includes('must be configured') ? 503 : 502;
    res.status(status).json({ error: message });
  }
});

router.get('/instagram/:igAccountId/media', async (req: Request, res: Response) => {
  try {
    const client = getMetaClient();
    const limit = Number(req.query.limit) || 10;
    const media = await client.getInstagramMedia(req.params.igAccountId, limit);
    res.json(media);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    const status = message.includes('must be configured') ? 503 : 502;
    res.status(status).json({ error: message });
  }
});

router.get('/instagram/:igAccountId/insights', async (req: Request, res: Response) => {
  try {
    const client = getMetaClient();
    const period = (req.query.period as string) || 'day';
    const insights = await client.getInstagramInsights(req.params.igAccountId, period);
    res.json(insights);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    const status = message.includes('must be configured') ? 503 : 502;
    res.status(status).json({ error: message });
  }
});

// ---- LinkedIn ----

function getLinkedInClient(): LinkedInClient {
  const accessToken = process.env.LINKEDIN_ACCESS_TOKEN;
  const organizationId = process.env.LINKEDIN_ORG_ID;
  if (!accessToken || !organizationId) {
    throw new Error('LINKEDIN_ACCESS_TOKEN and LINKEDIN_ORG_ID must be configured');
  }
  return new LinkedInClient({ accessToken, organizationId });
}

router.get('/linkedin/organization', async (_req: Request, res: Response) => {
  try {
    const client = getLinkedInClient();
    const org = await client.getOrganization();
    res.json(org);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    const status = message.includes('must be configured') ? 503 : 502;
    res.status(status).json({ error: message });
  }
});

router.get('/linkedin/followers', async (_req: Request, res: Response) => {
  try {
    const client = getLinkedInClient();
    const stats = await client.getFollowerStats();
    res.json(stats);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    const status = message.includes('must be configured') ? 503 : 502;
    res.status(status).json({ error: message });
  }
});

router.get('/linkedin/stats', async (req: Request, res: Response) => {
  try {
    const client = getLinkedInClient();
    const dateFrom = (req.query.from as string) || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const dateTo = (req.query.to as string) || new Date().toISOString().split('T')[0];
    const stats = await client.getShareStats(dateFrom, dateTo);
    res.json(stats);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    const status = message.includes('must be configured') ? 503 : 502;
    res.status(status).json({ error: message });
  }
});

router.get('/linkedin/posts', async (req: Request, res: Response) => {
  try {
    const client = getLinkedInClient();
    const count = Number(req.query.count) || 10;
    const posts = await client.getPosts(count);
    res.json(posts);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    const status = message.includes('must be configured') ? 503 : 502;
    res.status(status).json({ error: message });
  }
});

export default router;
