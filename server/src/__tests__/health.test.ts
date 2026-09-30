import request from 'supertest';
import { app } from '../index';

describe('Health Check API', () => {
  it('should return status ok', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('status', 'ok');
    expect(res.body).toHaveProperty('service', 'NodeBinding AI API');
  });
});
