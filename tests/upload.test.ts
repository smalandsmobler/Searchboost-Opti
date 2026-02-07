import request from 'supertest';
import path from 'path';
import fs from 'fs';
import { createApp } from '../src/app';

const app = createApp();
const uploadsDir = path.join(process.cwd(), 'uploads');

afterAll(() => {
  if (fs.existsSync(uploadsDir)) {
    const files = fs.readdirSync(uploadsDir);
    for (const file of files) {
      fs.unlinkSync(path.join(uploadsDir, file));
    }
  }
});

describe('POST /upload', () => {
  it('uploads a file successfully', async () => {
    const testFilePath = path.join(__dirname, 'fixtures', 'test-image.png');

    const res = await request(app).post('/upload').attach('file', testFilePath);

    expect(res.status).toBe(201);
    expect(res.body.message).toBe('File uploaded successfully');
    expect(res.body.file).toHaveProperty('originalName', 'test-image.png');
    expect(res.body.file).toHaveProperty('filename');
    expect(res.body.file).toHaveProperty('size');
    expect(res.body.file).toHaveProperty('mimetype', 'image/png');
  });

  it('returns 400 when no file is provided', async () => {
    const res = await request(app).post('/upload');

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('No file provided');
  });

  it('rejects files with disallowed mime types', async () => {
    const testFilePath = path.join(__dirname, 'fixtures', 'test-file.txt');

    const res = await request(app).post('/upload').attach('file', testFilePath);

    expect(res.status).toBe(415);
    expect(res.body.error).toMatch(/File type .* is not allowed/);
  });
});

describe('GET /upload', () => {
  it('lists uploaded files', async () => {
    const testFilePath = path.join(__dirname, 'fixtures', 'test-image.png');
    await request(app).post('/upload').attach('file', testFilePath);

    const res = await request(app).get('/upload');

    expect(res.status).toBe(200);
    expect(res.body.files).toBeInstanceOf(Array);
    expect(res.body.files.length).toBeGreaterThan(0);
    expect(res.body.count).toBeGreaterThan(0);
    expect(res.body.files[0]).toHaveProperty('filename');
    expect(res.body.files[0]).toHaveProperty('size');
    expect(res.body.files[0]).toHaveProperty('uploadedAt');
  });

  it('filters files by type', async () => {
    const res = await request(app).get('/upload?type=png');

    expect(res.status).toBe(200);
    expect(res.body.files.every((f: { filename: string }) => f.filename.endsWith('.png'))).toBe(
      true,
    );
  });
});

describe('GET /upload/:filename', () => {
  it('downloads an uploaded file', async () => {
    const testFilePath = path.join(__dirname, 'fixtures', 'test-image.png');

    const uploadRes = await request(app).post('/upload').attach('file', testFilePath);
    const { filename } = uploadRes.body.file;

    const downloadRes = await request(app).get(`/upload/${filename}`);

    expect(downloadRes.status).toBe(200);
    expect(downloadRes.headers['content-disposition']).toContain(filename);
  });

  it('returns 404 for non-existent file', async () => {
    const res = await request(app).get('/upload/does-not-exist.png');

    expect(res.status).toBe(404);
    expect(res.body.error).toBe('File not found');
  });
});

describe('DELETE /upload/:filename', () => {
  it('deletes an uploaded file', async () => {
    const testFilePath = path.join(__dirname, 'fixtures', 'test-image.png');
    const uploadRes = await request(app).post('/upload').attach('file', testFilePath);
    const { filename } = uploadRes.body.file;

    const deleteRes = await request(app).delete(`/upload/${filename}`);

    expect(deleteRes.status).toBe(200);
    expect(deleteRes.body.message).toBe('File deleted successfully');

    const getRes = await request(app).get(`/upload/${filename}`);
    expect(getRes.status).toBe(404);
  });

  it('returns 404 when deleting non-existent file', async () => {
    const res = await request(app).delete('/upload/does-not-exist.png');

    expect(res.status).toBe(404);
    expect(res.body.error).toBe('File not found');
  });
});

describe('API key auth', () => {
  it('allows requests when no API_KEY is configured', async () => {
    const res = await request(app).get('/upload');
    expect(res.status).toBe(200);
  });

  it('rejects requests with wrong API key when API_KEY is set', async () => {
    process.env.API_KEY = 'test-secret-key';

    const res = await request(app).get('/upload');
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Invalid or missing API key');

    delete process.env.API_KEY;
  });

  it('allows requests with correct API key', async () => {
    process.env.API_KEY = 'test-secret-key';

    const res = await request(app).get('/upload').set('x-api-key', 'test-secret-key');
    expect(res.status).toBe(200);

    delete process.env.API_KEY;
  });
});
