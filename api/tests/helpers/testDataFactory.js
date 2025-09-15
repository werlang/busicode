import { randomUUID } from 'crypto';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

/**
 * Test data factory for creating consistent test data
 */
export class TestDataFactory {
  
  static createStudentData(overrides = {}) {
    return {
      id: randomUUID(),
      name: `Test Student ${Math.random().toString(36).substring(2, 8)}`,
      class_id: randomUUID(),
      initial_balance: 100.00,
      current_balance: 100.00,
      created_at: new Date(),
      ...overrides
    };
  }

  static createClassData(overrides = {}) {
    return {
      id: randomUUID(),
      name: `Test Class ${Math.random().toString(36).substring(2, 8)}`,
      created_at: new Date(),
      ...overrides
    };
  }

  static createCompanyData(overrides = {}) {
    return {
      id: randomUUID(),
      name: `Test Company ${Math.random().toString(36).substring(2, 8)}`,
      class_id: randomUUID(),
      initial_budget: 200.00,
      current_budget: 200.00,
      created_at: new Date(),
      ...overrides
    };
  }

  static createProductData(overrides = {}) {
    return {
      id: randomUUID(),
      name: `Test Product ${Math.random().toString(36).substring(2, 8)}`,
      price: 29.99,
      company_id: randomUUID(),
      description: 'Test product description',
      created_at: new Date(),
      ...overrides
    };
  }

  static createAdminData(overrides = {}) {
    const username = `admin_${Math.random().toString(36).substring(2, 8)}`;
    return {
      id: randomUUID(),
      username,
      password_hash: bcrypt.hashSync('testpass123', 10),
      created_at: new Date(),
      is_active: true,
      ...overrides
    };
  }

  static createSaleData(overrides = {}) {
    return {
      id: randomUUID(),
      product_id: randomUUID(),
      student_id: randomUUID(),
      amount: 29.99,
      quantity: 1,
      total: 29.99,
      created_at: new Date(),
      ...overrides
    };
  }

  static createRevenueData(overrides = {}) {
    return {
      id: randomUUID(),
      company_id: randomUUID(),
      description: 'Test revenue',
      amount: 150.00,
      created_at: new Date(),
      ...overrides
    };
  }

  static createExpenseData(overrides = {}) {
    return {
      id: randomUUID(),
      company_id: randomUUID(),
      description: 'Test expense',
      amount: 75.00,
      created_at: new Date(),
      ...overrides
    };
  }

  static createMemberData(overrides = {}) {
    return {
      id: randomUUID(),
      company_id: randomUUID(),
      student_id: randomUUID(),
      contribution: 50.00,
      created_at: new Date(),
      ...overrides
    };
  }

  // Generate JWT token for testing
  static createJWTToken(payload = {}) {
    const defaultPayload = {
      id: randomUUID(),
      username: 'test_admin',
      type: 'admin',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
    };
    
    return jwt.sign(
      { ...defaultPayload, ...payload }, 
      process.env.JWT_SECRET || 'test-secret'
    );
  }

  // Create expired JWT token for testing
  static createExpiredJWTToken(payload = {}) {
    const defaultPayload = {
      id: randomUUID(),
      username: 'test_admin',
      type: 'admin',
      iat: Math.floor(Date.now() / 1000) - (25 * 60 * 60), // 25 hours ago
      exp: Math.floor(Date.now() / 1000) - (1 * 60 * 60) // 1 hour ago (expired)
    };
    
    return jwt.sign(
      { ...defaultPayload, ...payload }, 
      process.env.JWT_SECRET || 'test-secret'
    );
  }

  // Create malformed JWT token for testing
  static createMalformedJWTToken() {
    return 'invalid.jwt.token';
  }
}

export default TestDataFactory;