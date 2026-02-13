import request from 'supertest';
import app from '../../app';
import { UserModel } from '../../models/user.model';

describe('Authentication Routes', () => {
  const testUser = {
    email: 'testauth@example.com',
    password: 'Test@123',
    phoneNumber: '1234567890',
    fullName: 'Test Auth User',
  };

  const adminUser = {
    email: 'admin@example.com',
    password: 'Admin@123',
    phoneNumber: '9876543210',
    fullName: 'Admin User',
    role: 'admin',
  };

  beforeAll(async () => {
    await UserModel.deleteMany({ email: { $in: [testUser.email, adminUser.email] } });
  });

  afterAll(async () => {
    await UserModel.deleteMany({ email: { $in: [testUser.email, adminUser.email] } });
  });

  describe('POST /api/v1/auth/register', () => {
    test('should register a new user with valid data', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(testUser);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('User registered successfully');
      expect(response.body.data.email).toBe(testUser.email);
    });

    test('should not register user with existing email', async () => {
      // First registration
      await request(app)
        .post('/api/v1/auth/register')
        .send(testUser);

      // Second registration with same email should fail
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(testUser);

      expect(response.status).toBe(500); // Error from service (statusCode ?? 500)
      expect(response.body.success).toBe(false);
    });

    test('should not register user with invalid email', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          ...testUser,
          email: 'invalid-email',
        });

      expect(response.status).toBe(400); // Validation error from zod
      expect(response.body.success).toBe(false);
    });

    test('should not register user with weak password', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          ...testUser,
          email: 'weak@example.com',
          password: 'weak', // No uppercase, no number
        });

      expect(response.status).toBe(400); // Validation error
      expect(response.body.success).toBe(false);
    });

    test('should not register user with missing required fields', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: testUser.email,
          password: testUser.password,
          // Missing fullName and phoneNumber
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/auth/login', () => {
    beforeAll(async () => {
      // Register a user for login tests
      await request(app)
        .post('/api/v1/auth/register')
        .send(testUser);
    });

    test('should login user with correct credentials', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Login successful');
      expect(response.body.data.token).toBeDefined();
    });

    test('should not login user with wrong password', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUser.email,
          password: 'WrongPassword@123',
        });

      expect(response.status).toBe(500); // Error from service
      expect(response.body.success).toBe(false);
    });

    test('should not login user with non-existent email', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: testUser.password,
        });

      expect(response.status).toBe(500); // Error from service
      expect(response.body.success).toBe(false);
    });

    test('should not login without credentials', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({});

      expect(response.status).toBe(400); // Validation error
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/auth/request-password-reset', () => {
    beforeAll(async () => {
      // Ensure user exists
      const existingUser = await UserModel.findOne({ email: testUser.email });
      if (!existingUser) {
        await request(app)
          .post('/api/v1/auth/register')
          .send(testUser);
      }
    });

    test('should send password reset email for valid email', async () => {
      const response = await request(app)
        .post('/api/v1/auth/request-password-reset')
        .send({
          email: testUser.email,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Password reset email sent');
    });

    test('should not send reset email for non-existent email', async () => {
      const response = await request(app)
        .post('/api/v1/auth/request-password-reset')
        .send({
          email: 'nonexistent@example.com',
        });

      expect(response.status).toBe(500); // Error from service
      expect(response.body.success).toBe(false);
    });

    test('should not send reset email without email field', async () => {
      const response = await request(app)
        .post('/api/v1/auth/request-password-reset')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/v1/auth/reset-password/:token', () => {
    test('should fail with invalid token', async () => {
      const response = await request(app)
        .put('/api/v1/auth/reset-password/invalid-token')
        .send({
          newPassword: 'NewPassword@123',
        });

      expect(response.status).toBe(500); // Error from service
      expect(response.body.success).toBe(false);
    });

    test('should fail with missing password', async () => {
      const response = await request(app)
        .put('/api/v1/auth/reset-password/some-token')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test('should fail with weak password', async () => {
      const response = await request(app)
        .put('/api/v1/auth/reset-password/some-token')
        .send({
          newPassword: 'weak',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });
});