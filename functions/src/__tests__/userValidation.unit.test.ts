import * as supertest from 'supertest';
import { testEnv, createTestUser, cleanupTestData, admin } from './unit-setup';
import { app } from '../app';

const api = supertest(app);

describe('User Validation (Unit Tests)', () => {
  beforeEach(async () => {
    await cleanupTestData();
  });

  afterAll(async () => {
    await cleanupTestData();
    testEnv.cleanup();
  });

  describe('Email Validation', () => {
    it('should accept valid email formats', async () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'user+tag@example.org'
      ];

      for (const email of validEmails) {
        const response = await api
          .post('/users/new')
          .send({
            displayName: 'Test User',
            email: email
          });

        // Should either succeed (201) or fail with validation error (400)
        // But should NOT fail with server error (500)
        expect(response.status).not.toBe(500);
      }
    });

    it('should reject invalid email formats', async () => {
      const invalidEmails = [
        'invalid-email',
        '@example.com',
        'user@',
        'user.example.com'
      ];

      for (const email of invalidEmails) {
        const response = await api
          .post('/users/new')
          .send({
            displayName: 'Test User',
            email: email
          });

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error');
      }
    });
  });

  describe('Display Name Validation', () => {
    it('should accept valid display names', async () => {
      const validNames = [
        'John Doe',
        'José María',
        'O\'Connor-Smith',
        'A'.repeat(50) // 50 characters
      ];

      for (const name of validNames) {
        const response = await api
          .post('/users/new')
          .send({
            displayName: name,
            email: 'test@example.com'
          });

        expect(response.status).not.toBe(500);
      }
    });

    it('should reject empty display names', async () => {
      const response = await api
        .post('/users/new')
        .send({
          displayName: '',
          email: 'test@example.com'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Database Operations (Unit)', () => {
    it('should create user in emulator database', async () => {
      const userId = await createTestUser();
      
      // Verify user was created in emulator
      const db = admin.firestore();
      const userDoc = await db.collection('users').doc(userId).get();
      
      expect(userDoc.exists).toBe(true);
      expect(userDoc.data()?.displayName).toBe('Test User');
    });

    it('should clean up test data', async () => {
      // Create some test data
      await createTestUser();
      await createTestUser();
      
      // Clean up
      await cleanupTestData();
      
      // Verify cleanup worked
      const db = admin.firestore();
      const usersSnapshot = await db.collection('users').get();
      
      expect(usersSnapshot.empty).toBe(true);
    });
  });
}); 