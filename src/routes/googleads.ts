import { Router, Request, Response } from 'express';
import { GoogleAdsClient } from '../services/googleads';

const router = Router();

function getClient(): GoogleAdsClient {
  const clientId = process.env.GOOGLE_ADS_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_ADS_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_ADS_REFRESH_TOKEN;
  const developerToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN;
  const customerId = process.env.GOOGLE_ADS_CUSTOMER_ID;

  if (!clientId || !clientSecret || !refreshToken || !developerToken || !customerId) {
    throw new Error('Google Ads credentials are not configured');
  }

  return new GoogleAdsClient({ clientId, clientSecret, refreshToken, developerToken, customerId });
}

router.get('/campaigns', async (_req: Request, res: Response) => {
  try {
    const client = getClient();
    const campaigns = await client.getCampaigns();
    res.json(campaigns);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    const status = message.includes('not configured') ? 503 : 502;
    res.status(status).json({ error: message });
  }
});

router.get('/campaigns/metrics', async (req: Request, res: Response) => {
  try {
    const client = getClient();
    const dateFrom = (req.query.from as string) || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const dateTo = (req.query.to as string) || new Date().toISOString().split('T')[0];
    const metrics = await client.getCampaignMetrics(dateFrom, dateTo);
    res.json(metrics);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    const status = message.includes('not configured') ? 503 : 502;
    res.status(status).json({ error: message });
  }
});

router.get('/campaigns/:campaignId/keywords', async (req: Request, res: Response) => {
  try {
    const client = getClient();
    const dateFrom = (req.query.from as string) || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const dateTo = (req.query.to as string) || new Date().toISOString().split('T')[0];
    const keywords = await client.getKeywordPerformance(req.params.campaignId, dateFrom, dateTo);
    res.json(keywords);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    const status = message.includes('not configured') ? 503 : 502;
    res.status(status).json({ error: message });
  }
});

router.get('/ads', async (req: Request, res: Response) => {
  try {
    const client = getClient();
    const dateFrom = (req.query.from as string) || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const dateTo = (req.query.to as string) || new Date().toISOString().split('T')[0];
    const ads = await client.getAdPerformance(dateFrom, dateTo);
    res.json(ads);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    const status = message.includes('not configured') ? 503 : 502;
    res.status(status).json({ error: message });
  }
});

export default router;
