import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { authenticateToken } from '../../middleware/auth.js';
import CustomError from '../../helpers/error.js';
import TestDataFactory from '../helpers/testDataFactory.js';
import jwt from 'jsonwebtoken';

describe('Authentication Middleware', () => {
  let req, res, next;
  let validToken, expiredToken, invalidToken;

  beforeEach(() => {
    req = {
      headers: {},
      admin: null
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();

    validToken = TestDataFactory.createJWTToken();
    expiredToken = TestDataFactory.createExpiredJWTToken();
    invalidToken = TestDataFactory.createMalformedJWTToken();
  });

  describe('authenticateToken middleware', () => {
    test('should pass authentication with valid token', async () => {
      req.headers.authorization = `Bearer ${validToken}`;

      await authenticateToken(req, res, next);

      expect(next).toHaveBeenCalledWith();
      expect(req.admin).toBeDefined();
      expect(req.admin).toHaveProperty('id');
      expect(req.admin).toHaveProperty('username');
      expect(req.admin).toHaveProperty('type', 'admin');
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });

    test('should fail without authorization header', async () => {
      await authenticateToken(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(CustomError));
      expect(req.admin).toBeNull();
      
      const error = next.mock.calls[0][0];
      expect(error.status).toBe(401);
      expect(error.message).toBe('Access token required');
    });

    test('should fail with malformed authorization header', async () => {
      req.headers.authorization = 'Invalid format';

      await authenticateToken(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(CustomError));
      
      const error = next.mock.calls[0][0];
      expect(error.status).toBe(401);
      expect(error.message).toBe('Access token required');
    });

    test('should fail with invalid token', async () => {
      req.headers.authorization = `Bearer ${invalidToken}`;

      await authenticateToken(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(CustomError));
      
      const error = next.mock.calls[0][0];
      expect(error.status).toBe(401);
      expect(error.message).toBe('Invalid token');
    });

    test('should fail with expired token', async () => {
      req.headers.authorization = `Bearer ${expiredToken}`;

      await authenticateToken(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(CustomError));
      
      const error = next.mock.calls[0][0];
      expect(error.status).toBe(401);
      expect(error.message).toBe('Invalid token');
    });

    test('should handle empty bearer token', async () => {
      req.headers.authorization = 'Bearer ';

      await authenticateToken(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(CustomError));
      
      const error = next.mock.calls[0][0];
      expect(error.status).toBe(401);
      expect(error.message).toBe('Access token required');
    });

    test('should handle bearer token with extra spaces', async () => {
      req.headers.authorization = `Bearer  ${validToken}  `;

      await authenticateToken(req, res, next);

      // Should still work despite extra spaces
      expect(next).toHaveBeenCalledWith();
      expect(req.admin).toBeDefined();
    });

    test('should extract correct user information from token', async () => {
      const customPayload = {
        id: 'custom-admin-id',
        username: 'custom_admin',
        type: 'admin'
      };
      const customToken = TestDataFactory.createJWTToken(customPayload);
      req.headers.authorization = `Bearer ${customToken}`;

      await authenticateToken(req, res, next);

      expect(next).toHaveBeenCalledWith();
      expect(req.admin.id).toBe(customPayload.id);
      expect(req.admin.username).toBe(customPayload.username);
      expect(req.admin.type).toBe(customPayload.type);
    });

    test('should handle token without admin type', async () => {
      const userPayload = {
        id: 'user-id',
        username: 'regular_user',
        type: 'user' // Not admin
      };
      const userToken = TestDataFactory.createJWTToken(userPayload);
      req.headers.authorization = `Bearer ${userToken}`;

      await authenticateToken(req, res, next);

      // Should still pass - type validation is business logic, not auth
      expect(next).toHaveBeenCalledWith();
      expect(req.admin.type).toBe('user');
    });

    test('should handle token with missing fields', async () => {
      const incompletePayload = {
        id: 'admin-id'
        // Missing username and type
      };
      const incompleteToken = TestDataFactory.createJWTToken(incompletePayload);
      req.headers.authorization = `Bearer ${incompleteToken}`;

      await authenticateToken(req, res, next);

      expect(next).toHaveBeenCalledWith();
      expect(req.admin.id).toBe(incompletePayload.id);
      expect(req.admin.username).toBeUndefined();
      expect(req.admin.type).toBeUndefined();
    });

    test('should handle different JWT secrets', async () => {
      // Create token with different secret
      const payload = { id: 'admin-id', username: 'admin', type: 'admin' };
      const wrongSecretToken = jwt.sign(payload, 'wrong-secret', { expiresIn: '24h' });
      req.headers.authorization = `Bearer ${wrongSecretToken}`;

      await authenticateToken(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(CustomError));
      
      const error = next.mock.calls[0][0];
      expect(error.status).toBe(401);
      expect(error.message).toBe('Invalid token');
    });

    test('should handle case variations in authorization header', async () => {
      // Test different case variations
      const variations = [
        `bearer ${validToken}`,
        `BEARER ${validToken}`,
        `Bearer ${validToken}`,
        `BeArEr ${validToken}`
      ];

      for (const authHeader of variations) {
        req.headers.authorization = authHeader;
        req.admin = null; // Reset
        next.mockClear();

        await authenticateToken(req, res, next);

        expect(next).toHaveBeenCalledWith();
        expect(req.admin).toBeDefined();
      }
    });

    test('should handle authorization header with multiple spaces', async () => {
      req.headers.authorization = `Bearer     ${validToken}`;

      await authenticateToken(req, res, next);

      expect(next).toHaveBeenCalledWith();
      expect(req.admin).toBeDefined();
    });

    test('should handle authorization without Bearer prefix', async () => {
      req.headers.authorization = validToken;

      await authenticateToken(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(CustomError));
      
      const error = next.mock.calls[0][0];
      expect(error.status).toBe(401);
      expect(error.message).toBe('Access token required');
    });

    test('should handle JWT token with additional claims', async () => {
      const extendedPayload = {
        id: 'admin-id',
        username: 'admin',
        type: 'admin',
        role: 'super_admin',
        permissions: ['read', 'write', 'delete'],
        custom_field: 'custom_value'
      };
      const extendedToken = TestDataFactory.createJWTToken(extendedPayload);
      req.headers.authorization = `Bearer ${extendedToken}`;

      await authenticateToken(req, res, next);

      expect(next).toHaveBeenCalledWith();
      expect(req.admin.id).toBe(extendedPayload.id);
      expect(req.admin.username).toBe(extendedPayload.username);
      expect(req.admin.type).toBe(extendedPayload.type);
      expect(req.admin.role).toBe(extendedPayload.role);
      expect(req.admin.permissions).toEqual(extendedPayload.permissions);
      expect(req.admin.custom_field).toBe(extendedPayload.custom_field);
    });

    test('should handle multiple consecutive authentication calls', async () => {
      req.headers.authorization = `Bearer ${validToken}`;

      // First call
      await authenticateToken(req, res, next);
      expect(next).toHaveBeenCalledTimes(1);
      expect(req.admin).toBeDefined();

      const firstAdmin = req.admin;
      next.mockClear();

      // Second call (should work the same)
      await authenticateToken(req, res, next);
      expect(next).toHaveBeenCalledTimes(1);
      expect(req.admin).toBeDefined();
      expect(req.admin.id).toBe(firstAdmin.id);
    });

    test('should handle token at exact expiration boundary', async () => {
      // Create token that expires in 1 second
      const almostExpiredPayload = {
        id: 'admin-id',
        username: 'admin',
        type: 'admin',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 1 // Expires in 1 second
      };
      const almostExpiredToken = jwt.sign(
        almostExpiredPayload, 
        process.env.JWT_SECRET || 'test-secret'
      );
      req.headers.authorization = `Bearer ${almostExpiredToken}`;

      await authenticateToken(req, res, next);

      // Should pass if called immediately
      expect(next).toHaveBeenCalledWith();
      expect(req.admin).toBeDefined();
    });

    test('should handle very long JWT tokens', async () => {
      const largePayload = {
        id: 'admin-id',
        username: 'admin',
        type: 'admin',
        large_data: 'A'.repeat(10000) // Very large claim
      };
      const largeToken = TestDataFactory.createJWTToken(largePayload);
      req.headers.authorization = `Bearer ${largeToken}`;

      await authenticateToken(req, res, next);

      expect(next).toHaveBeenCalledWith();
      expect(req.admin).toBeDefined();
      expect(req.admin.large_data).toBe(largePayload.large_data);
    });
  });

  describe('Error Handling Edge Cases', () => {
    test('should handle null authorization header', async () => {
      req.headers.authorization = null;

      await authenticateToken(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(CustomError));
    });

    test('should handle undefined authorization header', async () => {
      req.headers.authorization = undefined;

      await authenticateToken(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(CustomError));
    });

    test('should handle empty headers object', async () => {
      req.headers = {};

      await authenticateToken(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(CustomError));
    });

    test('should handle missing headers property', async () => {
      delete req.headers;

      await authenticateToken(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(CustomError));
    });

    test('should handle corrupted JWT structure', async () => {
      const corruptedTokens = [
        'header.payload', // Missing signature
        'header.payload.signature.extra', // Too many parts
        'onlyonepart', // Only one part
        '', // Empty string
        '   ', // Only whitespace
        'Bearer', // Just the word Bearer
        'Bearer ', // Bearer with space but no token
      ];

      for (const corruptedToken of corruptedTokens) {
        req.headers.authorization = `Bearer ${corruptedToken}`;
        req.admin = null;
        next.mockClear();

        await authenticateToken(req, res, next);

        expect(next).toHaveBeenCalledWith(expect.any(CustomError));
        const error = next.mock.calls[0][0];
        expect(error.status).toBe(401);
      }
    });

    test('should handle JWT with invalid JSON in payload', async () => {
      // Create a malformed JWT manually
      const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64');
      const payload = Buffer.from('{ invalid json }').toString('base64'); // Invalid JSON
      const signature = 'invalid_signature';
      const malformedJWT = `${header}.${payload}.${signature}`;

      req.headers.authorization = `Bearer ${malformedJWT}`;

      await authenticateToken(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(CustomError));
      const error = next.mock.calls[0][0];
      expect(error.status).toBe(401);
    });
  });

  describe('Performance and Security', () => {
    test('should not expose sensitive information in errors', async () => {
      req.headers.authorization = `Bearer ${invalidToken}`;

      await authenticateToken(req, res, next);

      const error = next.mock.calls[0][0];
      expect(error.message).not.toContain(process.env.JWT_SECRET);
      expect(error.message).not.toContain('secret');
      expect(error.message).toBe('Invalid token');
    });

    test('should handle multiple rapid authentication attempts', async () => {
      req.headers.authorization = `Bearer ${validToken}`;

      // Simulate rapid consecutive calls
      const promises = Array(10).fill().map(() => {
        const mockNext = jest.fn();
        return authenticateToken({ ...req }, res, mockNext).then(() => mockNext);
      });

      const results = await Promise.all(promises);

      // All should succeed
      results.forEach(mockNext => {
        expect(mockNext).toHaveBeenCalledWith(); // Called without error
      });
    });

    test('should not modify request object on failure', async () => {
      const originalReq = { ...req };
      req.headers.authorization = `Bearer ${invalidToken}`;

      await authenticateToken(req, res, next);

      // req.admin should still be null
      expect(req.admin).toBe(originalReq.admin);
      expect(Object.keys(req)).toEqual(Object.keys(originalReq));
    });

    test('should handle concurrent authentication with different tokens', async () => {
      const token1 = TestDataFactory.createJWTToken({ id: 'admin1', username: 'admin1' });
      const token2 = TestDataFactory.createJWTToken({ id: 'admin2', username: 'admin2' });

      const req1 = { headers: { authorization: `Bearer ${token1}` }, admin: null };
      const req2 = { headers: { authorization: `Bearer ${token2}` }, admin: null };

      const next1 = jest.fn();
      const next2 = jest.fn();

      await Promise.all([
        authenticateToken(req1, res, next1),
        authenticateToken(req2, res, next2)
      ]);

      // Both should succeed with different admin info
      expect(next1).toHaveBeenCalledWith();
      expect(next2).toHaveBeenCalledWith();
      expect(req1.admin.id).toBe('admin1');
      expect(req2.admin.id).toBe('admin2');
      expect(req1.admin.id).not.toBe(req2.admin.id);
    });
  });
});