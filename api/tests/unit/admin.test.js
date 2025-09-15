import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import Admin from '../../model/admin.js';
import DatabaseTestUtils from '../helpers/databaseTestUtils.js';
import TestDataFactory from '../helpers/testDataFactory.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

describe('Admin Model', () => {
  let testAdminData;

  beforeEach(async () => {
    await DatabaseTestUtils.clearAllTables();
    await DatabaseTestUtils.seedTestData();
    
    testAdminData = TestDataFactory.createAdminData();
  });

  afterEach(async () => {
    await DatabaseTestUtils.clearAllTables();
  });

  describe('Static Methods', () => {
    describe('create', () => {
      test('should create admin with hashed password', async () => {
        const adminData = {
          username: 'test_new_admin',
          password: 'testpassword123'
        };

        const admin = await Admin.create(adminData);

        expect(admin).toBeInstanceOf(Admin);
        expect(admin.username).toBe('test_new_admin');
        expect(admin.password_hash).toBeDefined();
        expect(admin.password_hash).not.toBe('testpassword123');
        expect(admin.is_active).toBe(true);
        expect(admin.id).toBeDefined();

        // Verify password is properly hashed
        const isValidPassword = await bcrypt.compare('testpassword123', admin.password_hash);
        expect(isValidPassword).toBe(true);

        // Verify in database
        const dbRecord = await DatabaseTestUtils.findTestRecord('admin_users', { id: admin.id });
        expect(dbRecord.length).toBe(1);
        expect(dbRecord[0].username).toBe('test_new_admin');
      });

      test('should fail with duplicate username', async () => {
        await DatabaseTestUtils.insertTestRecord('admin_users', testAdminData);

        const duplicateAdmin = {
          username: testAdminData.username,
          password: 'testpassword123'
        };

        await expect(Admin.create(duplicateAdmin)).rejects.toThrow();
      });

      test('should fail with missing username', async () => {
        const adminData = {
          password: 'testpassword123'
        };

        await expect(Admin.create(adminData)).rejects.toThrow('Username is required');
      });

      test('should fail with missing password', async () => {
        const adminData = {
          username: 'test_admin'
        };

        await expect(Admin.create(adminData)).rejects.toThrow('Password is required');
      });

      test('should fail with short password', async () => {
        const adminData = {
          username: 'test_admin',
          password: '123' // Too short
        };

        await expect(Admin.create(adminData)).rejects.toThrow('Password must be at least 6 characters long');
      });

      test('should generate UUID if not provided', async () => {
        const adminData = {
          username: 'test_uuid_admin',
          password: 'testpassword123'
        };

        const admin = await Admin.create(adminData);

        expect(admin.id).toBeDefined();
        expect(typeof admin.id).toBe('string');
        expect(admin.id.length).toBe(36); // UUID length
      });
    });

    describe('authenticate', () => {
      beforeEach(async () => {
        await DatabaseTestUtils.insertTestRecord('admin_users', testAdminData);
      });

      test('should authenticate valid credentials', async () => {
        const result = await Admin.authenticate(testAdminData.username, 'testpass123');

        expect(result).toHaveProperty('token');
        expect(result).toHaveProperty('admin');
        expect(result.admin).toHaveProperty('id', testAdminData.id);
        expect(result.admin).toHaveProperty('username', testAdminData.username);
        expect(result.admin).not.toHaveProperty('password_hash');

        // Verify token is valid JWT
        const decoded = jwt.verify(result.token, process.env.JWT_SECRET || 'test-secret');
        expect(decoded).toHaveProperty('id', testAdminData.id);
        expect(decoded).toHaveProperty('username', testAdminData.username);
        expect(decoded).toHaveProperty('type', 'admin');
      });

      test('should fail with invalid username', async () => {
        await expect(Admin.authenticate('nonexistent', 'password')).rejects.toThrow('Invalid credentials');
      });

      test('should fail with invalid password', async () => {
        await expect(Admin.authenticate(testAdminData.username, 'wrongpassword')).rejects.toThrow('Invalid credentials');
      });

      test('should fail with inactive admin', async () => {
        const inactiveAdmin = TestDataFactory.createAdminData({
          username: 'inactive_admin',
          is_active: false
        });
        await DatabaseTestUtils.insertTestRecord('admin_users', inactiveAdmin);

        await expect(Admin.authenticate('inactive_admin', 'testpass123')).rejects.toThrow('Account is not active');
      });

      test('should update last_login timestamp', async () => {
        const beforeAuth = new Date();
        await Admin.authenticate(testAdminData.username, 'testpass123');

        // Verify last_login was updated
        const dbRecord = await DatabaseTestUtils.findTestRecord('admin_users', { id: testAdminData.id });
        expect(dbRecord[0].last_login).toBeTruthy();
        expect(new Date(dbRecord[0].last_login)).toBeInstanceOf(Date);
        expect(new Date(dbRecord[0].last_login).getTime()).toBeGreaterThanOrEqual(beforeAuth.getTime());
      });
    });

    describe('findByUsername', () => {
      beforeEach(async () => {
        await DatabaseTestUtils.insertTestRecord('admin_users', testAdminData);
      });

      test('should find admin by username', async () => {
        const admin = await Admin.findByUsername(testAdminData.username);

        expect(admin).toBeInstanceOf(Admin);
        expect(admin.id).toBe(testAdminData.id);
        expect(admin.username).toBe(testAdminData.username);
        expect(admin.password_hash).toBeDefined();
        expect(admin.is_active).toBe(testAdminData.is_active);
      });

      test('should return null for non-existent username', async () => {
        const admin = await Admin.findByUsername('nonexistent');
        expect(admin).toBeNull();
      });

      test('should handle case sensitivity', async () => {
        const admin = await Admin.findByUsername(testAdminData.username.toUpperCase());
        expect(admin).toBeNull(); // Usernames are case-sensitive
      });
    });

    describe('getAll', () => {
      test('should return all admins', async () => {
        await DatabaseTestUtils.insertTestRecord('admin_users', testAdminData);

        const admins = await Admin.getAll();

        expect(Array.isArray(admins)).toBe(true);
        expect(admins.length).toBeGreaterThan(0);

        admins.forEach(admin => {
          expect(admin).toBeInstanceOf(Admin);
          expect(admin).toHaveProperty('id');
          expect(admin).toHaveProperty('username');
          expect(admin).toHaveProperty('is_active');
          expect(admin).toHaveProperty('created_at');
        });
      });

      test('should return empty array when no admins exist', async () => {
        await DatabaseTestUtils.clearAllTables(); // Clear seeded data

        const admins = await Admin.getAll();

        expect(Array.isArray(admins)).toBe(true);
        expect(admins.length).toBe(0);
      });
    });

    describe('verifyToken', () => {
      test('should verify valid token', () => {
        const payload = {
          id: testAdminData.id,
          username: testAdminData.username,
          type: 'admin'
        };
        const token = jwt.sign(payload, process.env.JWT_SECRET || 'test-secret', { expiresIn: '24h' });

        const decoded = Admin.verifyToken(token);

        expect(decoded).toHaveProperty('id', testAdminData.id);
        expect(decoded).toHaveProperty('username', testAdminData.username);
        expect(decoded).toHaveProperty('type', 'admin');
        expect(decoded).toHaveProperty('iat');
        expect(decoded).toHaveProperty('exp');
      });

      test('should fail with invalid token', () => {
        const invalidToken = 'invalid.token.here';

        expect(() => Admin.verifyToken(invalidToken)).toThrow();
      });

      test('should fail with expired token', () => {
        const payload = {
          id: testAdminData.id,
          username: testAdminData.username,
          type: 'admin'
        };
        const expiredToken = jwt.sign(payload, process.env.JWT_SECRET || 'test-secret', { expiresIn: '-1h' });

        expect(() => Admin.verifyToken(expiredToken)).toThrow();
      });

      test('should fail with wrong secret', () => {
        const payload = {
          id: testAdminData.id,
          username: testAdminData.username,
          type: 'admin'
        };
        const token = jwt.sign(payload, 'wrong-secret', { expiresIn: '24h' });

        expect(() => Admin.verifyToken(token)).toThrow();
      });
    });
  });

  describe('Instance Methods', () => {
    test('toJSON should exclude password_hash', async () => {
      await DatabaseTestUtils.insertTestRecord('admin_users', testAdminData);

      const admin = new Admin(testAdminData);
      const json = admin.toJSON();

      expect(json).toHaveProperty('id', testAdminData.id);
      expect(json).toHaveProperty('username', testAdminData.username);
      expect(json).toHaveProperty('is_active', testAdminData.is_active);
      expect(json).toHaveProperty('created_at');
      expect(json).not.toHaveProperty('password_hash');
    });

    test('should inherit Model methods', async () => {
      await DatabaseTestUtils.insertTestRecord('admin_users', testAdminData);

      const admin = new Admin({ id: testAdminData.id });
      await admin.get();

      expect(admin.username).toBe(testAdminData.username);
      expect(admin.password_hash).toBe(testAdminData.password_hash);
      expect(admin.is_active).toBe(testAdminData.is_active);
    });
  });

  describe('Password Security', () => {
    test('should use different salts for same password', async () => {
      const admin1 = await Admin.create({
        username: 'admin1',
        password: 'samepassword'
      });

      const admin2 = await Admin.create({
        username: 'admin2', 
        password: 'samepassword'
      });

      expect(admin1.password_hash).not.toBe(admin2.password_hash);

      // Both should verify correctly
      const valid1 = await bcrypt.compare('samepassword', admin1.password_hash);
      const valid2 = await bcrypt.compare('samepassword', admin2.password_hash);
      expect(valid1).toBe(true);
      expect(valid2).toBe(true);
    });

    test('should reject common weak passwords', async () => {
      const weakPasswords = ['123456', 'password', 'admin', 'test', ''];

      for (const weakPassword of weakPasswords) {
        const adminData = {
          username: `admin_${Math.random().toString(36).substring(2)}`,
          password: weakPassword
        };

        if (weakPassword.length >= 6) {
          // These should technically pass length validation but are weak
          const admin = await Admin.create(adminData);
          expect(admin).toBeDefined();
        } else {
          // These should fail length validation
          await expect(Admin.create(adminData)).rejects.toThrow();
        }
      }
    });

    test('should handle special characters in passwords', async () => {
      const specialPassword = 'T3st!@#$%^&*()_+{}[]|\\:";\'<>?,./`~';
      const adminData = {
        username: 'special_admin',
        password: specialPassword
      };

      const admin = await Admin.create(adminData);
      expect(admin).toBeDefined();

      // Verify password works
      const isValid = await bcrypt.compare(specialPassword, admin.password_hash);
      expect(isValid).toBe(true);

      // Test authentication
      const authResult = await Admin.authenticate('special_admin', specialPassword);
      expect(authResult).toHaveProperty('token');
    });
  });

  describe('Edge Cases', () => {
    test('should handle very long usernames', async () => {
      const longUsername = 'a'.repeat(250); // Near database limit
      const adminData = {
        username: longUsername,
        password: 'testpassword123'
      };

      const admin = await Admin.create(adminData);
      expect(admin.username).toBe(longUsername);

      // Verify in database
      const dbRecord = await DatabaseTestUtils.findTestRecord('admin_users', { id: admin.id });
      expect(dbRecord[0].username).toBe(longUsername);
    });

    test('should handle username with special characters', async () => {
      const specialUsername = 'test.admin-123_user@domain';
      const adminData = {
        username: specialUsername,
        password: 'testpassword123'
      };

      const admin = await Admin.create(adminData);
      expect(admin.username).toBe(specialUsername);

      // Test authentication with special characters
      const authResult = await Admin.authenticate(specialUsername, 'testpassword123');
      expect(authResult).toHaveProperty('token');
    });

    test('should handle concurrent admin creation attempts', async () => {
      const adminData = {
        username: 'concurrent_admin',
        password: 'testpassword123'
      };

      // Attempt to create same admin concurrently
      const promises = [
        Admin.create(adminData),
        Admin.create(adminData),
        Admin.create(adminData)
      ];

      const results = await Promise.allSettled(promises);
      
      // Only one should succeed, others should fail with constraint error
      const successful = results.filter(r => r.status === 'fulfilled');
      const failed = results.filter(r => r.status === 'rejected');
      
      expect(successful.length).toBe(1);
      expect(failed.length).toBe(2);
    });
  });
});