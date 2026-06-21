const request = require('supertest');
const app = require('../server');

describe('EcoShift API Endpoints', () => {
  it('GET /api/habits should return a list of predefined habits', async () => {
    const res = await request(app).get('/api/habits');
    expect(res.statusCode).toEqual(200);
    expect(Array.isArray(res.body)).toBeTruthy();
    expect(res.body.length).toBeGreaterThan(0);
    
    // Check if the structure is correct
    expect(res.body[0]).toHaveProperty('id');
    expect(res.body[0]).toHaveProperty('name');
    expect(res.body[0]).toHaveProperty('co2_savings_per_action');
  });

  it('GET /api/users should return a list of users or empty array', async () => {
    const res = await request(app).get('/api/users');
    expect(res.statusCode).toEqual(200);
    expect(Array.isArray(res.body)).toBeTruthy();
  });

  it('GET /api/dashboard should return correct dashboard statistics structure', async () => {
    const res = await request(app).get('/api/dashboard');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('total_co2_saved');
    expect(res.body).toHaveProperty('total_users');
    expect(res.body).toHaveProperty('total_actions');
    expect(Array.isArray(res.body.user_stats)).toBeTruthy();
    expect(Array.isArray(res.body.habit_stats)).toBeTruthy();
  });

  it('GET / should serve the index.html', async () => {
    const res = await request(app).get('/');
    expect(res.statusCode).toEqual(200);
    expect(res.headers['content-type']).toMatch(/html/);
  });

  describe('POST Endpoints', () => {
    let testUserId;

    it('POST /api/users should create a new user', async () => {
      const res = await request(app).post('/api/users').send({
        name: 'Test User',
        email: 'test@example.com',
        internship_start_date: '2026-01-01'
      });
      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty('id');
      testUserId = res.body.id;
    });

    it('POST /api/users should validate input', async () => {
      const res = await request(app).post('/api/users').send({
        name: '',
        email: 'invalid-email'
      });
      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty('errors');
    });

    it('POST /api/users/:userId/habits should save habits for user', async () => {
      const res = await request(app).post(`/api/users/${testUserId}/habits`).send({
        habitIds: [1, 2, 3]
      });
      expect(res.statusCode).toEqual(201);
      expect(res.body.message).toEqual('Habits selected successfully');
    });

    it('POST /api/logs should log an action', async () => {
      const res = await request(app).post('/api/logs').send({
        user_id: testUserId,
        habit_id: 1,
        date: '2026-06-21',
        quantity: 5,
        notes: 'Test note'
      });
      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.message).toEqual('Action logged successfully');
    });
  });

  describe('Edge Cases and Additional Tests', () => {
    it('GET /api/unknown-route should return 404', async () => {
      const res = await request(app).get('/api/unknown-route');
      expect(res.statusCode).toEqual(404);
      expect(res.body).toHaveProperty('error', 'Endpoint not found');
    });

    it('GET /api/dashboard with query parameters should filter data', async () => {
      const res = await request(app)
        .get('/api/dashboard')
        .query({ startDate: '2026-06-01', endDate: '2026-06-30' });
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('total_co2_saved');
    });

    it('GET /api/dashboard with invalid query parameters should fail', async () => {
      const res = await request(app)
        .get('/api/dashboard')
        .query({ startDate: 'invalid-date' });
      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty('errors');
    });
  });
});
