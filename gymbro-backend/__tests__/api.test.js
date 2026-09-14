// The Admin SDK initializes at import time against a real service account,
// which CI does not have and should not have. Mocking the module keeps these
// tests to the routing and auth-gate behaviour they actually cover — none of
// the paths asserted below reach Firebase, because verifyToken rejects a
// missing or malformed header before it ever calls verifyIdToken.
jest.mock('../config/firebase', () => {
  // Both AI controllers call admin.firestore() at module scope, so the mock has
  // to satisfy that at import time even though no test here performs a write.
  const firestore = () => ({
    collection: jest.fn(),
    doc: jest.fn(),
    batch: jest.fn(),
  });
  firestore.FieldValue = {
    serverTimestamp: jest.fn(),
    increment: jest.fn(),
  };

  return {
    auth: () => ({ verifyIdToken: jest.fn() }),
    firestore,
  };
});

const request = require('supertest');
const app = require('../index');

describe('GET /health', () => {
  it('answers 200 without authentication', async () => {
    const res = await request(app).get('/health');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });
});

describe('unknown routes', () => {
  it('falls through to the 404 handler rather than the error handler', async () => {
    const res = await request(app).get('/api/ai/nonexistent');

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ success: false, error: 'Route not found' });
  });
});

describe('auth gate', () => {
  it('rejects a request carrying no Authorization header', async () => {
    const res = await request(app).post('/api/ai/chat').send({});

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('MISSING_TOKEN');
  });

  it('rejects an Authorization header that is not a Bearer token', async () => {
    const res = await request(app)
      .post('/api/ai/chat')
      .set('Authorization', 'Token abc123')
      .send({});

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('MISSING_TOKEN');
  });
});
