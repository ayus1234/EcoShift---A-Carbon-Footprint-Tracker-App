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
});
