import request from 'supertest';
import { createApp } from '../src/app';

const app = createApp();

describe('SE Ranking routes', () => {
  it('returns 503 when SERANKING_API_KEY is not set', async () => {
    delete process.env.SERANKING_API_KEY;

    const res = await request(app).get('/seranking/account');

    expect(res.status).toBe(503);
    expect(res.body.error).toBe('SERANKING_API_KEY is not configured');
  });

  it('returns 503 for sites when SERANKING_API_KEY is not set', async () => {
    delete process.env.SERANKING_API_KEY;

    const res = await request(app).get('/seranking/sites');

    expect(res.status).toBe(503);
    expect(res.body.error).toBe('SERANKING_API_KEY is not configured');
  });

  it('returns 503 for keywords when SERANKING_API_KEY is not set', async () => {
    delete process.env.SERANKING_API_KEY;

    const res = await request(app).get('/seranking/sites/1/keywords');

    expect(res.status).toBe(503);
    expect(res.body.error).toBe('SERANKING_API_KEY is not configured');
  });

  it('returns 503 for audit when SERANKING_API_KEY is not set', async () => {
    delete process.env.SERANKING_API_KEY;

    const res = await request(app).get('/seranking/sites/1/audit');

    expect(res.status).toBe(503);
    expect(res.body.error).toBe('SERANKING_API_KEY is not configured');
  });

  it('returns 400 for volume with missing keywords', async () => {
    process.env.SERANKING_API_KEY = 'test-key';

    const res = await request(app).post('/seranking/volume').send({});

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('keywords must be an array of strings');

    delete process.env.SERANKING_API_KEY;
  });
});
