import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { buildServer } from '../app';
import { FastifyInstance } from 'fastify';

// ---- Registration tests ----

describe('User Controller - Registration', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildServer();
	  await app.ready();
	  // List routes for debugging
	  console.log("All routes:\n", app.printRoutes());
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    // Clean up test users before each test to ensure isolation
    // This prevents tests from interfering with each other
    try {
      app.db.prepare("DELETE FROM users WHERE email LIKE 'test%@example.com'").run();
    } catch (err) {
    }
  });

  describe('POST /auth/register', () => {
    it('should register a new user successfully', async () => {
      const testEmail = 'test1@example.com';
      const testPassword = 'SecurePass123!';
      
      const response = await app.inject({
        method: 'POST',
        url: '/auth/register',
        payload: {
          email: testEmail,
          password: testPassword,
        },
      });

      expect(response.statusCode).toBe(201);
      
      // Check that a token cookie was set
      expect(response.cookies).toBeDefined();
      const tokenCookie = response.cookies.find(c => c.name === 'token');
      expect(tokenCookie).toBeDefined();
      expect(tokenCookie?.value).toBeTruthy();

      // Verify the user now exists in the db
      const userInDb = app.db
        .prepare('SELECT * FROM users WHERE email = ?')
        .get(testEmail) as any;

      expect(userInDb).toBeDefined();
      expect(userInDb.email).toBe(testEmail);
      expect(userInDb.id).toBeDefined();
      
      // Verify password was hashed
      expect(userInDb.password).not.toBe(testPassword);
      expect(userInDb.password).toBeTruthy();
      expect(userInDb.password.length).toBeGreaterThan(20);
    });

    it('should return 400 for invalid email format', async () => {
      const invalidEmail = 'invalid-email';
      
      const response = await app.inject({
        method: 'POST',
        url: '/auth/register',
        payload: {
          email: invalidEmail,
          password: 'SecurePass123!',
        },
      });

      expect(response.statusCode).toBe(400);
      const body = response.json();
      expect(body.errors).toBeDefined();

      // Verify no user was created in database
      const userInDb = app.db
        .prepare('SELECT * FROM users WHERE email = ?')
        .get(invalidEmail) as any;
      
      expect(userInDb).toBeUndefined();
    });

    it('should return 400 for missing password', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/auth/register',
        payload: {
          email: 'test2@example.com',
        },
      });

      expect(response.statusCode).toBe(400);
      const body = response.json();
      expect(body.errors).toBeDefined();
    });

    it('should return 400 for too short password', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/auth/register',
        payload: {
          email: 'test3@example.com',
          password: '123', // Too short
        },
      });

      expect(response.statusCode).toBe(400);
      const body = response.json();
      expect(body.errors).toBeDefined();
    });

    it('should return 409 when email already exists', async () => {
      const userData = {
        email: 'test4@example.com',
        password: 'SecurePass123!',
      };

      // First registration should succeed
      const firstResponse = await app.inject({
        method: 'POST',
        url: '/auth/register',
        payload: userData,
      });
      expect(firstResponse.statusCode).toBe(201);

      // Second registration with same email should fail
      const secondResponse = await app.inject({
        method: 'POST',
        url: '/auth/register',
        payload: userData,
      });

      expect(secondResponse.statusCode).toBe(409);
      const body = secondResponse.json();
      expect(body.message).toBe('Email already registered');
    });

    it('should normalize email to lowercase', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/auth/register',
        payload: {
          email: 'TEST5@EXAMPLE.COM',
          password: 'SecurePass123!',
        },
      });

      expect(response.statusCode).toBe(201);

      // Try to register with lowercase version - should fail as duplicate
      const duplicateResponse = await app.inject({
        method: 'POST',
        url: '/auth/register',
        payload: {
          email: 'test5@example.com',
          password: 'SecurePass123!',
        },
      });

      expect(duplicateResponse.statusCode).toBe(409);
    });

    it('should return 400 for empty payload', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/auth/register',
        payload: {},
      });

      expect(response.statusCode).toBe(400);
      const body = response.json();
      expect(body.errors).toBeDefined();
    });
  });
	
	
	// ---- Login tests ----
	

  describe('POST /auth/login', () => {
    const testEmail = 'testlogin@example.com';
    const testPassword = 'SecurePass123!';

    beforeEach(async () => {
      // Create a test user before each login test
      await app.inject({
        method: 'POST',
        url: '/auth/register',
        payload: {
          email: testEmail,
          password: testPassword,
        },
      });
    });

    it('should login successfully with valid credentials', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/auth/login',
        payload: {
          email: testEmail,
          password: testPassword,
        },
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual({});

      // Verify token cookie was set
      expect(response.cookies).toBeDefined();
      const tokenCookie = response.cookies.find(c => c.name === 'token');
      expect(tokenCookie).toBeDefined();
      expect(tokenCookie?.value).toBeTruthy();
      expect(tokenCookie?.httpOnly).toBe(true);
      expect(tokenCookie?.path).toBe('/');
    });

    it('should return 401 for wrong password', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/auth/login',
        payload: {
          email: testEmail,
          password: 'WrongPassword123!',
        },
      });

      expect(response.statusCode).toBe(401);
      const body = response.json();
      expect(body.error).toBe('Invalid credentials');

      // Verify no token cookie was set
      const tokenCookie = response.cookies.find(c => c.name === 'token');
      expect(tokenCookie).toBeUndefined();
    });

    it('should return 401 for non-existent email', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/auth/login',
        payload: {
          email: 'nonexistent@example.com',
          password: testPassword,
        },
      });

      expect(response.statusCode).toBe(401);
      const body = response.json();
      expect(body.error).toBe('Invalid credentials');
    });

    it('should return 400 for invalid email format', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/auth/login',
        payload: {
          email: 'invalid-email',
          password: testPassword,
        },
      });

      expect(response.statusCode).toBe(400);
      const body = response.json();
      expect(body.errors).toBeDefined();
    });

    it('should return 400 for missing password', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/auth/login',
        payload: {
          email: testEmail,
        },
      });

      expect(response.statusCode).toBe(400);
      const body = response.json();
      expect(body.errors).toBeDefined();
    });

    it('should return 400 for missing email', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/auth/login',
        payload: {
          password: testPassword,
        },
      });

      expect(response.statusCode).toBe(400);
      const body = response.json();
      expect(body.errors).toBeDefined();
    });

    it('should login with case-insensitive email', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/auth/login',
        payload: {
          email: 'TESTLOGIN@EXAMPLE.COM', // Uppercase
          password: testPassword,
        },
      });

      expect(response.statusCode).toBe(200);
      const tokenCookie = response.cookies.find(c => c.name === 'token');
      expect(tokenCookie).toBeDefined();
    });

    it('should return 400 for empty payload', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/auth/login',
        payload: {},
      });

      expect(response.statusCode).toBe(400);
      const body = response.json();
      expect(body.errors).toBeDefined();
    });

    it('should not allow SQL injection in email field', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/auth/login',
        payload: {
          email: "admin'--",
          password: 'anything',
        },
      });

      // Should fail with 400 or 401
      expect([400, 401]).toContain(response.statusCode);
    });
  });
});

