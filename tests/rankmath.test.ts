import request from 'supertest';
import { createApp } from '../src/app';

const app = createApp();

describe('RankMath routes', () => {
  it('returns 503 for posts when not configured', async () => {
    delete process.env.WP_SITE_URL;
    delete process.env.RANKMATH_API_KEY;

    const res = await request(app).get('/rankmath/posts');

    expect(res.status).toBe(503);
    expect(res.body.error).toBe('WP_SITE_URL and RANKMATH_API_KEY must be configured');
  });

  it('returns 503 for pages when not configured', async () => {
    delete process.env.WP_SITE_URL;
    delete process.env.RANKMATH_API_KEY;

    const res = await request(app).get('/rankmath/pages');

    expect(res.status).toBe(503);
    expect(res.body.error).toBe('WP_SITE_URL and RANKMATH_API_KEY must be configured');
  });

  it('returns 503 for post SEO meta when not configured', async () => {
    delete process.env.WP_SITE_URL;

    const res = await request(app).get('/rankmath/posts/1/seo');

    expect(res.status).toBe(503);
    expect(res.body.error).toBe('WP_SITE_URL and RANKMATH_API_KEY must be configured');
  });

  it('returns 503 for update post SEO when not configured', async () => {
    delete process.env.WP_SITE_URL;

    const res = await request(app)
      .put('/rankmath/posts/1/seo')
      .send({ title: 'Test', focusKeyword: 'test' });

    expect(res.status).toBe(503);
  });

  it('returns 503 for health when not configured', async () => {
    delete process.env.WP_SITE_URL;

    const res = await request(app).get('/rankmath/health');

    expect(res.status).toBe(503);
  });
});
