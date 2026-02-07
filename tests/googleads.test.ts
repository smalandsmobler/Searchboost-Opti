import request from 'supertest';
import { createApp } from '../src/app';

const app = createApp();

describe('Google Ads routes', () => {
  it('returns 503 for campaigns when not configured', async () => {
    delete process.env.GOOGLE_ADS_CLIENT_ID;

    const res = await request(app).get('/googleads/campaigns');

    expect(res.status).toBe(503);
    expect(res.body.error).toBe('Google Ads credentials are not configured');
  });

  it('returns 503 for campaign metrics when not configured', async () => {
    const res = await request(app).get('/googleads/campaigns/metrics');

    expect(res.status).toBe(503);
    expect(res.body.error).toBe('Google Ads credentials are not configured');
  });

  it('returns 503 for keyword performance when not configured', async () => {
    const res = await request(app).get('/googleads/campaigns/123/keywords');

    expect(res.status).toBe(503);
  });

  it('returns 503 for ad performance when not configured', async () => {
    const res = await request(app).get('/googleads/ads');

    expect(res.status).toBe(503);
  });
});
