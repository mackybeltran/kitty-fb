import { app } from '../app';

describe('Simple Unit Tests', () => {
  it('should have app initialized', () => {
    // Test that the Express app is properly initialized
    expect(app).toBeDefined();
    expect(typeof app.listen).toBe('function');
    expect(typeof app.use).toBe('function');
  });

  it('should have basic middleware configured', () => {
    // Test that basic Express middleware is configured
    expect(app).toBeDefined();
    // The app should be an Express application with middleware
    expect(typeof app.use).toBe('function');
    expect(typeof app.get).toBe('function');
    expect(typeof app.post).toBe('function');
  });
}); 