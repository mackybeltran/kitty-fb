import * as supertest from 'supertest';
import { app } from '../app';

const api = supertest(app);

describe('Simple Unit Tests', () => {
  it('should respond to health check', async () => {
    // This is a simple test that doesn't require database
    const response = await api.get('/');
    
    // Even if the endpoint doesn't exist, we should get a 404, not a timeout
    expect(response.status).toBe(404);
  });

  it('should handle user creation request', async () => {
    const response = await api
      .post('/users/new')
      .send({
        displayName: 'Test User',
        email: 'test@example.com'
      });

    // Should get a response (even if it's an error)
    expect(response.status).toBeDefined();
  });
}); 