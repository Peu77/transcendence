import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildServer } from './app';
import { FastifyInstance } from 'fastify';
import jwt from 'jsonwebtoken';

describe('App', () => {
  let app: FastifyInstance;
  let authToken: string;

  beforeAll(async () => {
    app = await buildServer();
    await app.ready();
    
    // Create a test JWT token
    authToken = jwt.sign(
      { userId: 'test-user-id' },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );
  });

  afterAll(async () => {
    await app.close();
  });

  it('should return hello world message', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/hello',
      cookies: {
        token: authToken,  // Include auth token in cookies
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ message: 'Hello World' });
  });
});

