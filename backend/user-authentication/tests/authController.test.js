/**
 * authController.test.js - Test suite for authentication service
 * Tests user registration, login, token refresh, and logout
 */

const request = require('supertest');
const app = require('../server');
const authModel = require('../models/authModel');
const { initializeAuthDatabase } = require('../setup');
beforeAll(async () => {
  process.env.DB_PATH = require('path').join(__dirname, '../database/auth.sqlite');
  await initializeAuthDatabase();
});
beforeEach(async () => {
  await authModel.clearRefreshTokens();
});


describe('Authentication Service', () => {
  const uniqueSuffix = Date.now();
  // Test data
  const testUser = {
    email: `test${uniqueSuffix}@clemson.edu`,
    password: 'Test123456',
    first_name: 'John',
    last_name: 'Doe',
    role: 'user'
  };

  let accessToken;
  let refreshToken;
  let userId;

  /** 
   * USER REGISTRATION TESTS 
   */
  describe('POST /api/auth/register', () => {
    
    test('should register a new user with valid data', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send(testUser)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.user).toBeDefined();
      expect(response.body.user.email).toBe(testUser.email.toLowerCase());
      expect(response.body.user.firstName).toBe(testUser.first_name);
      expect(response.body.tokens).toBeDefined();
      expect(response.body.tokens.accessToken).toBeDefined();
      expect(response.body.tokens.refreshToken).toBeDefined();

      // Store for later tests
      userId = response.body.user.id;
      accessToken = response.body.tokens.accessToken;
      refreshToken = response.body.tokens.refreshToken;
    });

    test('should reject registration with missing required fields', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'incomplete@clemson.edu',
          password: 'Test123456'
          // Missing first_name and last_name
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Missing required fields');
    });

    test('should reject registration with invalid email format', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          ...testUser,
          email: 'invalid-email'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid email format');
    });

    test('should reject registration with weak password (too short)', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          ...testUser,
          email: 'test2@clemson.edu',
          password: 'Short1'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Weak password');
    });

    test('should reject registration with weak password (no uppercase)', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          ...testUser,
          email: 'test3@clemson.edu',
          password: 'lowercase123'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Weak password');
    });

    test('should reject registration with weak password (no number)', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          ...testUser,
          email: 'test4@clemson.edu',
          password: 'NoNumbers'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Weak password');
    });

    test('should reject registration with duplicate email', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send(testUser) // Same email as first test
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Email already exists');
    });

    test('should reject registration with invalid role', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          ...testUser,
          email: 'test5@clemson.edu',
          role: 'superadmin' // Invalid role
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid role');
    });

    test('should accept registration with organizer role', async () => {
      const uniqueEmail = `organizer${Date.now()}@clemson.edu`;
      const response = await request(app)
      .post('/api/auth/register')
      .send({
          ...testUser,
          email: uniqueEmail,
          role: 'organizer'
        })
        .expect(201);

  expect(response.body.success).toBe(true);
  expect(response.body.user.role).toBe('organizer');
    });
  });

  /** 
   * USER LOGIN TESTS 
   */
  describe('POST /api/auth/login', () => {
    
    test('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.user).toBeDefined();
      expect(response.body.user.email).toBe(testUser.email.toLowerCase());
      expect(response.body.tokens).toBeDefined();
      expect(response.body.tokens.accessToken).toBeDefined();
      expect(response.body.tokens.refreshToken).toBeDefined();
    });

    test('should reject login with missing credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email
          // Missing password
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Missing credentials');
    });

    test('should reject login with non-existent email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@clemson.edu',
          password: 'Test123456'
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid credentials');
    });

    test('should reject login with incorrect password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'WrongPassword123'
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid credentials');
    });

    test('should be case-insensitive for email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email.toUpperCase(),
          password: testUser.password
        })
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  /** 
   * TOKEN REFRESH TESTS 
   */
  describe('POST /api/auth/refresh', () => {
    let freshRefreshToken;
    let uniqueEmail;
    const password = 'Test123456';
    beforeEach(async () => {
      uniqueEmail = `refreshuser${Date.now()}@clemson.edu`;
      const registerResp = await request(app)
      .post('/api/auth/register')
      .send({
        email: uniqueEmail,
        password,
        first_name: 'Refresh',
        last_name: 'Man',
        role: 'user'
      });
      const loginResp = await request(app)
      .post('/api/auth/login')
      .send({
        email: uniqueEmail,
        password
      });
      freshRefreshToken = loginResp.body.tokens.refreshToken;
    });

  test('should refresh access token with valid refresh token', async () => {
    const response = await request(app)
      .post('/api/auth/refresh')
      .send({
        refreshToken: freshRefreshToken
      })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.tokens).toBeDefined();
    expect(response.body.tokens.accessToken).toBeDefined();
    expect(response.body.tokens.refreshToken).toBeDefined();
  });

  test('should reject refresh with missing refresh token', async () => {
    const response = await request(app)
      .post('/api/auth/refresh')
      .send({})
      .expect(400);

    expect(response.body.success).toBe(false);
    expect(response.body.error).toBe('Missing refresh token');
  });

  test('should reject refresh with invalid refresh token', async () => {
    const response = await request(app)
      .post('/api/auth/refresh')
      .send({
        refreshToken: 'invalid-token-12345'
      })
      .expect(401);

    expect(response.body.success).toBe(false);
    expect(response.body.error).toBe('Invalid refresh token');
  });
});

  /** 
   * PROTECTED ROUTE TESTS 
   */
  describe('GET /api/auth/me', () => {
    
    test('should get current user with valid access token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.user).toBeDefined();
      expect(response.body.user.email).toBe(testUser.email.toLowerCase());
    });

    test('should reject request without access token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Authentication required');
    });

    test('should reject request with invalid access token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid token');
    });
  });

  /** 
   * LOGOUT TESTS 
   */
  describe('POST /api/auth/logout', () => {
    
    test('should logout and revoke refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .send({
          refreshToken: refreshToken
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Logout successful');
    });

    test('should not allow refresh with revoked token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({
          refreshToken: refreshToken
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    test('should reject logout with missing refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Missing refresh token');
    });
  });

  /** 
   * LOGOUT ALL DEVICES TESTS 
   */
  describe('POST /api/auth/logout-all', () => {
    
    let newAccessToken;
    let newRefreshToken;
    beforeAll(async () => {
      const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
          email: testUser.email,
          password: testUser.password
      });
      if (!loginResponse.body.tokens) {
        throw new Error('Login failed: tokens undefined. Check refresh token uniqueness.');
      }
       newAccessToken = loginResponse.body.tokens.accessToken;
       newRefreshToken = loginResponse.body.tokens.refreshToken;
    });
    test('should logout from all devices', async () => {
      const response = await request(app)
        .post('/api/auth/logout-all')
        .set('Authorization', `Bearer ${newAccessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Logged out from all devices');
    });

    test('should require authentication for logout-all', async () => {
      const response = await request(app)
        .post('/api/auth/logout-all')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Authentication required');
    });
  });

  /** 
   * PASSWORD SECURITY TESTS 
   */
  describe('Password Hashing', () => {
    
    test('should never store plaintext passwords', async () => {
      const user = await authModel.findUserByEmail(testUser.email, true);
      
      expect(user.password_hash).toBeDefined();
      expect(user.password_hash).not.toBe(testUser.password);
      expect(user.password_hash.startsWith('$2')).toBe(true); // bcrypt hash format
    });
  });

  /** 
   * HEALTH CHECK TEST 
   */
  describe('GET /health', () => {
    
    test('should return health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body.service).toBe('user-authentication');
      expect(response.body.status).toBe('healthy');
    });
  });
});