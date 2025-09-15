import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import request from 'supertest';
import app from '../../app.js';
import Admin from '../../model/admin.js';
import DatabaseTestUtils from '../helpers/databaseTestUtils.js';
import TestDataFactory from '../helpers/testDataFactory.js';

describe('Authentication Routes', () => {
  let testAdminData;
  let validToken;
  let expiredToken;

  beforeEach(async () => {
    await DatabaseTestUtils.clearAllTables();
    const seededData = await DatabaseTestUtils.seedTestData();
    
    // Create test admin for authentication tests
    testAdminData = TestDataFactory.createAdminData({
      username: 'test_auth_admin',
      password_hash: '$2b$10$/A1majQZsUVesr42SJOcseIVkLVEkRo3/GT8ocz6bjbb4W.ujWG6.' // admin123
    });
    
    await DatabaseTestUtils.insertTestRecord('admin_users', testAdminData);
    
    validToken = TestDataFactory.createJWTToken({
      id: testAdminData.id,
      username: testAdminData.username
    });
    
    expiredToken = TestDataFactory.createExpiredJWTToken({
      id: testAdminData.id,
      username: testAdminData.username
    });
  });

  afterEach(async () => {
    await DatabaseTestUtils.clearAllTables();
  });

  describe('POST /auth/login', () => {
    test('should login successfully with valid credentials', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          username: 'test_auth_admin',
          password: 'admin123'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Login successful');
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('admin');
      expect(response.body.admin).toHaveProperty('id');
      expect(response.body.admin).toHaveProperty('username', 'test_auth_admin');
      expect(response.body.admin).not.toHaveProperty('password_hash');
    });

    test('should fail with invalid username', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          username: 'nonexistent_user',
          password: 'admin123'
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error', true);
      expect(response.body).toHaveProperty('message');
    });

    test('should fail with invalid password', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          username: 'test_auth_admin',
          password: 'wrong_password'
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error', true);
      expect(response.body).toHaveProperty('message');
    });

    test('should fail with missing username', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          password: 'admin123'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', true);
      expect(response.body).toHaveProperty('message', 'Username and password are required');
    });

    test('should fail with missing password', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          username: 'test_auth_admin'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', true);
      expect(response.body).toHaveProperty('message', 'Username and password are required');
    });

    test('should fail with empty request body', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', true);
      expect(response.body).toHaveProperty('message', 'Username and password are required');
    });

    test('should fail with inactive admin user', async () => {
      // Create inactive admin
      const inactiveAdmin = TestDataFactory.createAdminData({
        username: 'inactive_admin',
        is_active: false
      });
      await DatabaseTestUtils.insertTestRecord('admin_users', inactiveAdmin);

      const response = await request(app)
        .post('/auth/login')
        .send({
          username: 'inactive_admin',
          password: 'testpass123'
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error', true);
    });
  });

  describe('POST /auth/logout', () => {
    test('should logout successfully with valid token', async () => {
      const response = await request(app)
        .post('/auth/logout')
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Logout successful');
    });

    test('should fail without authorization header', async () => {
      const response = await request(app)
        .post('/auth/logout');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error', true);
      expect(response.body).toHaveProperty('message', 'Access token required');
    });

    test('should fail with invalid token format', async () => {
      const response = await request(app)
        .post('/auth/logout')
        .set('Authorization', 'InvalidTokenFormat');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error', true);
      expect(response.body).toHaveProperty('message', 'Access token required');
    });

    test('should fail with expired token', async () => {
      const response = await request(app)
        .post('/auth/logout')
        .set('Authorization', `Bearer ${expiredToken}`);

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error', true);
    });
  });

  describe('GET /auth/verify', () => {
    test('should verify valid token successfully', async () => {
      const response = await request(app)
        .get('/auth/verify')
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('valid', true);
      expect(response.body).toHaveProperty('admin');
      expect(response.body.admin).toHaveProperty('id');
      expect(response.body.admin).toHaveProperty('username');
    });

    test('should fail verification with invalid token', async () => {
      const invalidToken = TestDataFactory.createMalformedJWTToken();
      
      const response = await request(app)
        .get('/auth/verify')
        .set('Authorization', `Bearer ${invalidToken}`);

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error', true);
    });

    test('should fail verification without token', async () => {
      const response = await request(app)
        .get('/auth/verify');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error', true);
      expect(response.body).toHaveProperty('message', 'Access token required');
    });
  });

  describe('GET /auth/status', () => {
    test('should return authenticated status with valid token', async () => {
      const response = await request(app)
        .get('/auth/status')
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('authenticated', true);
      expect(response.body).toHaveProperty('admin');
      expect(response.body.admin).toHaveProperty('id');
      expect(response.body.admin).toHaveProperty('username');
    });

    test('should return unauthenticated status without token', async () => {
      const response = await request(app)
        .get('/auth/status');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('authenticated', false);
      expect(response.body).toHaveProperty('admin', null);
    });

    test('should return unauthenticated status with invalid token', async () => {
      const invalidToken = TestDataFactory.createMalformedJWTToken();
      
      const response = await request(app)
        .get('/auth/status')
        .set('Authorization', `Bearer ${invalidToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('authenticated', false);
      expect(response.body).toHaveProperty('admin', null);
    });

    test('should return unauthenticated status with expired token', async () => {
      const response = await request(app)
        .get('/auth/status')
        .set('Authorization', `Bearer ${expiredToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('authenticated', false);
      expect(response.body).toHaveProperty('admin', null);
    });
  });

  describe('POST /auth/create-admin', () => {
    test('should create admin successfully with valid token', async () => {
      const newAdminData = {
        username: 'new_test_admin',
        password: 'newpassword123'
      };

      const response = await request(app)
        .post('/auth/create-admin')
        .set('Authorization', `Bearer ${validToken}`)
        .send(newAdminData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('message', 'Admin user created successfully');
      expect(response.body).toHaveProperty('admin');
      expect(response.body.admin).toHaveProperty('username', 'new_test_admin');
      expect(response.body.admin).not.toHaveProperty('password_hash');
    });

    test('should fail to create admin without authentication', async () => {
      const newAdminData = {
        username: 'new_test_admin',
        password: 'newpassword123'
      };

      const response = await request(app)
        .post('/auth/create-admin')
        .send(newAdminData);

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error', true);
      expect(response.body).toHaveProperty('message', 'Access token required');
    });

    test('should fail with duplicate username', async () => {
      const duplicateAdminData = {
        username: testAdminData.username,
        password: 'newpassword123'
      };

      const response = await request(app)
        .post('/auth/create-admin')
        .set('Authorization', `Bearer ${validToken}`)
        .send(duplicateAdminData);

      expect(response.status).toBe(409);
      expect(response.body).toHaveProperty('error', true);
    });
  });

  describe('GET /auth/admins', () => {
    test('should list all admins with valid token', async () => {
      const response = await request(app)
        .get('/auth/admins')
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('admins');
      expect(Array.isArray(response.body.admins)).toBe(true);
      expect(response.body.admins.length).toBeGreaterThan(0);
      
      // Check that password hashes are not included
      response.body.admins.forEach(admin => {
        expect(admin).not.toHaveProperty('password_hash');
        expect(admin).toHaveProperty('id');
        expect(admin).toHaveProperty('username');
      });
    });

    test('should fail to list admins without authentication', async () => {
      const response = await request(app)
        .get('/auth/admins');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error', true);
      expect(response.body).toHaveProperty('message', 'Access token required');
    });
  });
});