import { Router, Request, Response } from 'express';
import { SERankingClient } from '../services/seranking';

const router = Router();

function getClient(): SERankingClient {
  const apiKey = process.env.SERANKING_API_KEY;
  if (!apiKey) {
    throw new Error('SERANKING_API_KEY is not configured');
  }
  return new SERankingClient({ apiKey });
}

router.get('/account', async (_req: Request, res: Response) => {
  try {
    const client = getClient();
    const account = await client.getAccount();
    res.json(account);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    const status = message.includes('not configured') ? 503 : 502;
    res.status(status).json({ error: message });
  }
});

router.get('/sites', async (_req: Request, res: Response) => {
  try {
    const client = getClient();
    const sites = await client.getSites();
    res.json(sites);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    const status = message.includes('not configured') ? 503 : 502;
    res.status(status).json({ error: message });
  }
});

router.get('/sites/:siteId/keywords', async (req: Request, res: Response) => {
  try {
    const client = getClient();
    const keywords = await client.getSiteKeywords(Number(req.params.siteId));
    res.json(keywords);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    const status = message.includes('not configured') ? 503 : 502;
    res.status(status).json({ error: message });
  }
});

router.get('/sites/:siteId/rankings', async (req: Request, res: Response) => {
  try {
    const client = getClient();
    const dateFrom = (req.query.from as string) || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const dateTo = (req.query.to as string) || new Date().toISOString().split('T')[0];
    const rankings = await client.getSiteRankings(Number(req.params.siteId), dateFrom, dateTo);
    res.json(rankings);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    const status = message.includes('not configured') ? 503 : 502;
    res.status(status).json({ error: message });
  }
});

router.get('/sites/:siteId/audit', async (req: Request, res: Response) => {
  try {
    const client = getClient();
    const audit = await client.getSiteAudit(Number(req.params.siteId));
    res.json(audit);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    const status = message.includes('not configured') ? 503 : 502;
    res.status(status).json({ error: message });
  }
});

router.get('/sites/:siteId/competitors', async (req: Request, res: Response) => {
  try {
    const client = getClient();
    const competitors = await client.getCompetitors(Number(req.params.siteId));
    res.json(competitors);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    const status = message.includes('not configured') ? 503 : 502;
    res.status(status).json({ error: message });
  }
});

router.post('/volume', async (req: Request, res: Response) => {
  try {
    const client = getClient();
    const { keywords, searchEngine, regionId } = req.body;
    if (!keywords || !Array.isArray(keywords)) {
      res.status(400).json({ error: 'keywords must be an array of strings' });
      return;
    }
    const volume = await client.getSearchVolume(keywords, searchEngine, regionId);
    res.json(volume);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    const status = message.includes('not configured') ? 503 : 502;
    res.status(status).json({ error: message });
  }
});

export default router;
