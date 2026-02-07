import request from 'supertest';
import { createApp } from '../src/app';

const app = createApp();

describe('Facebook routes', () => {
  it('returns 503 for insights when not configured', async () => {
    delete process.env.META_ACCESS_TOKEN;
    delete process.env.META_PAGE_ID;

    const res = await request(app).get('/social/facebook/insights');

    expect(res.status).toBe(503);
    expect(res.body.error).toBe('META_ACCESS_TOKEN and META_PAGE_ID must be configured');
  });

  it('returns 503 for posts when not configured', async () => {
    const res = await request(app).get('/social/facebook/posts');

    expect(res.status).toBe(503);
  });

  it('returns 503 for instagram account when not configured', async () => {
    const res = await request(app).get('/social/instagram/account');

    expect(res.status).toBe(503);
  });
});

describe('LinkedIn routes', () => {
  it('returns 503 for organization when not configured', async () => {
    delete process.env.LINKEDIN_ACCESS_TOKEN;
    delete process.env.LINKEDIN_ORG_ID;

    const res = await request(app).get('/social/linkedin/organization');

    expect(res.status).toBe(503);
    expect(res.body.error).toBe('LINKEDIN_ACCESS_TOKEN and LINKEDIN_ORG_ID must be configured');
  });

  it('returns 503 for followers when not configured', async () => {
    const res = await request(app).get('/social/linkedin/followers');

    expect(res.status).toBe(503);
  });

  it('returns 503 for posts when not configured', async () => {
    const res = await request(app).get('/social/linkedin/posts');

    expect(res.status).toBe(503);
  });
});
