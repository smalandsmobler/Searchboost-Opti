import request from 'supertest';
import path from 'path';
import fs from 'fs';
import { createApp } from '../src/app';

const app = createApp();
const uploadsDir = path.join(process.cwd(), 'uploads');

afterAll(() => {
  // Clean up any uploaded test files
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

  it('rejects files with disallowed mime types', async () => {
    const testFilePath = path.join(__dirname, 'fixtures', 'test-file.txt');

    const res = await request(app).post('/upload').attach('file', testFilePath);

    expect(res.status).toBe(415);
    expect(res.body.error).toMatch(/File type .* is not allowed/);
  });
});
