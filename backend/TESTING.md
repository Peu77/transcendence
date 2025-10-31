# Testing Guide Vitest

## Table of Contents
- [Getting Started](#getting-started)
- [Running Tests](#running-tests)
- [Writing Tests](#writing-tests)
- [Testing Patterns](#testing-patterns)
- [Examples](#examples)

## Getting Started

### Prerequisites
Make sure you have all dependencies installed:
```bash
npm install
```

## Running Tests

### Available Commands

```bash
# Run tests in watch mode (re-runs on file changes)
npm test

# Run tests once (CI/CD mode)
npm run test:run

# Run tests with verbose output
npm run test:verbose

# Run tests once with verbose output
npm run test:verbose:run
```

### Running Specific Tests

```bash
# Run tests in a specific file
npx vitest run src/users/user.controller.test.ts

# Run tests matching a pattern
npx vitest run -t "should register"
```

## Writing Tests

### Test File Structure

Test files should:
- Be named `*.test.ts`
- Be placed next to the file they're testing
- Follow the same directory structure as the source code

Example:
```
src/
  users/
    user.controller.ts
    user.controller.test.ts  ← Test file
```

### Basic Test Structure

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildServer } from '../app';
import { FastifyInstance } from 'fastify';

describe('Feature Name', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    // Setup: runs once before all tests
    app = await buildServer();
    await app.ready();
  });

  afterAll(async () => {
    // Cleanup: runs once after all tests
    await app.close();
  });

  it('should do something', async () => {
    // Arrange: set up test data
    const testData = { email: 'test@example.com' };

    // Act: perform the action
    const response = await app.inject({
      method: 'POST',
      url: '/auth/register',
      payload: testData,
    });

    // Assert: verify the result
    expect(response.statusCode).toBe(201);
  });
});
```

### Lifecycle Hooks

```typescript
import { beforeAll, afterAll, beforeEach, afterEach } from 'vitest';

describe('My Tests', () => {
  // Runs once before all tests in this describe block
  beforeAll(async () => {
    // Initialize app, connect to database, etc.
  });

  // Runs once after all tests in this describe block
  afterAll(async () => {
    // Close connections, clean up resources
  });

  // Runs before each test
  beforeEach(() => {
    // Reset database state, clear mocks, etc.
  });

  // Runs after each test
  afterEach(() => {
    // Clean up test-specific data
  });
});
```

## Testing Patterns

### 1. Testing HTTP Endpoints

Use `inject()` method to test endpoints without starting a server:

```typescript
const response = await app.inject({
  method: 'POST',
  url: '/auth/register',
  payload: {
    email: 'test@example.com',
    password: 'SecurePass123!',
  },
  headers: {
    'content-type': 'application/json',
  },
  cookies: {
    token: 'your-auth-token',  // For authenticated requests
  },
});

// Check response
expect(response.statusCode).toBe(201);
expect(response.json()).toEqual({ message: 'Success' });

// Check cookies
const tokenCookie = response.cookies.find(c => c.name === 'token');
expect(tokenCookie).toBeDefined();
expect(tokenCookie?.value).toBeTruthy();
```

### 2. Testing with Authentication

```typescript
import jwt from 'jsonwebtoken';

describe('Protected Routes', () => {
  let authToken: string;

  beforeAll(() => {
    // Create a test JWT token
    authToken = jwt.sign(
      { userId: 'test-user-id' },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );
  });

  it('should access protected route', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/users/me',
      cookies: {
        token: authToken,
      },
    });

    expect(response.statusCode).toBe(200);
  });
});
```

### 3. Testing Database Operations

```typescript
it('should create user in database', async () => {
  const testEmail = 'test@example.com';

  // Perform action
  await app.inject({
    method: 'POST',
    url: '/auth/register',
    payload: { email: testEmail, password: 'password123' },
  });

  // Verify in database
  const userInDb = app.db
    .prepare('SELECT * FROM users WHERE email = ?')
    .get(testEmail) as any;

  expect(userInDb).toBeDefined();
  expect(userInDb.email).toBe(testEmail);
  expect(userInDb.password).not.toBe('password123'); // Should be hashed
});
```

### 4. Cleaning Up Test Data

Use `beforeEach` to ensure test isolation:

```typescript
beforeEach(() => {
  // Clean up test users before each test
  try {
    app.db.prepare("DELETE FROM users WHERE email LIKE 'test%@example.com'").run();
  } catch (err) {
  }
});
```

### 5. Nested Test Suites

Organize related tests with nested `describe` blocks:

```typescript
describe('User Controller', () => {
  describe('POST /auth/register', () => {
    it('should register successfully', async () => {
      // Test registration success
    });

    it('should return 400 for invalid email', async () => {
      // Test validation
    });
  });

  describe('POST /auth/login', () => {
    it('should login successfully', async () => {
      // Test login success
    });

    it('should return 401 for wrong password', async () => {
      // Test authentication failure
    });
  });
});
```

## Examples

### Example 1: Simple GET Endpoint Test

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildServer } from './app';
import { FastifyInstance } from 'fastify';

describe('Health Check', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildServer();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should return 200 OK', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/health',
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ status: 'ok' });
  });
});
```

### Example 2: Testing with Setup and Cleanup

```typescript
describe('User Profile', () => {
  let app: FastifyInstance;
  let authToken: string;
  let userId: string;

  beforeAll(async () => {
    app = await buildServer();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    // Create a test user before each test
    const response = await app.inject({
      method: 'POST',
      url: '/auth/register',
      payload: {
        email: 'testuser@example.com',
        password: 'SecurePass123!',
      },
    });

    const tokenCookie = response.cookies.find(c => c.name === 'token');
    authToken = tokenCookie?.value || '';
    
    // Get user ID from database
    const user = app.db
      .prepare('SELECT id FROM users WHERE email = ?')
      .get('testuser@example.com') as any;
    userId = user.id;
  });

  afterEach(() => {
    // Clean up test user
    app.db.prepare('DELETE FROM users WHERE email = ?').run('testuser@example.com');
  });

  it('should get user profile', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/users/me',
      cookies: { token: authToken },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      id: userId,
      email: 'testuser@example.com',
    });
  });
});
```

### Example 3: Testing Validation

```typescript
describe('Input Validation', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildServer();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  const validationTestCases = [
    {
      name: 'invalid email format',
      payload: { email: 'not-an-email', password: 'ValidPass123!' },
      expectedStatus: 400,
    },
    {
      name: 'missing email',
      payload: { password: 'ValidPass123!' },
      expectedStatus: 400,
    },
    {
      name: 'missing password',
      payload: { email: 'test@example.com' },
      expectedStatus: 400,
    },
    {
      name: 'password too short',
      payload: { email: 'test@example.com', password: '123' },
      expectedStatus: 400,
    },
    {
      name: 'empty payload',
      payload: {},
      expectedStatus: 400,
    },
  ];

  validationTestCases.forEach(({ name, payload, expectedStatus }) => {
    it(`should return ${expectedStatus} for ${name}`, async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/auth/register',
        payload,
      });

      expect(response.statusCode).toBe(expectedStatus);
      expect(response.json().errors).toBeDefined();
    });
  });
});
```
