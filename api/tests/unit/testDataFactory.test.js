import { describe, test, expect } from '@jest/globals';
import TestDataFactory from '../helpers/testDataFactory.js';

describe('Test Data Factory', () => {
  describe('Student Data Creation', () => {
    test('should create valid student data', () => {
      const studentData = TestDataFactory.createStudentData();
      
      expect(studentData).toHaveProperty('id');
      expect(studentData).toHaveProperty('name');
      expect(studentData).toHaveProperty('class_id');
      expect(studentData).toHaveProperty('initial_balance');
      expect(studentData).toHaveProperty('current_balance');
      expect(typeof studentData.initial_balance).toBe('number');
      expect(typeof studentData.current_balance).toBe('number');
      expect(studentData.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
    });

    test('should apply overrides correctly', () => {
      const overrides = {
        name: 'Custom Student Name',
        initial_balance: 250.75
      };
      
      const studentData = TestDataFactory.createStudentData(overrides);
      
      expect(studentData.name).toBe('Custom Student Name');
      expect(studentData.initial_balance).toBe(250.75);
      expect(studentData).toHaveProperty('class_id'); // Should still have other properties
    });
  });

  describe('JWT Token Creation', () => {
    test('should create valid JWT token', () => {
      const token = TestDataFactory.createJWTToken();
      
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
    });

    test('should create expired JWT token', () => {
      const expiredToken = TestDataFactory.createExpiredJWTToken();
      
      expect(typeof expiredToken).toBe('string');
      expect(expiredToken.split('.')).toHaveLength(3);
    });

    test('should create malformed JWT token', () => {
      const malformedToken = TestDataFactory.createMalformedJWTToken();
      
      expect(malformedToken).toBe('invalid.jwt.token');
    });

    test('should apply custom payload to JWT', () => {
      const customPayload = {
        id: 'custom-id',
        username: 'custom-user'
      };
      
      const token = TestDataFactory.createJWTToken(customPayload);
      
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3);
    });
  });

  describe('Company Data Creation', () => {
    test('should create valid company data', () => {
      const companyData = TestDataFactory.createCompanyData();
      
      expect(companyData).toHaveProperty('id');
      expect(companyData).toHaveProperty('name');
      expect(companyData).toHaveProperty('class_id');
      expect(companyData).toHaveProperty('initial_budget');
      expect(companyData).toHaveProperty('current_budget');
      expect(typeof companyData.initial_budget).toBe('number');
      expect(typeof companyData.current_budget).toBe('number');
    });
  });

  describe('Product Data Creation', () => {
    test('should create valid product data', () => {
      const productData = TestDataFactory.createProductData();
      
      expect(productData).toHaveProperty('id');
      expect(productData).toHaveProperty('name');
      expect(productData).toHaveProperty('price');
      expect(productData).toHaveProperty('company_id');
      expect(typeof productData.price).toBe('number');
      expect(productData.price).toBe(29.99);
    });
  });

  describe('Admin Data Creation', () => {
    test('should create valid admin data', () => {
      const adminData = TestDataFactory.createAdminData();
      
      expect(adminData).toHaveProperty('id');
      expect(adminData).toHaveProperty('username');
      expect(adminData).toHaveProperty('password_hash');
      expect(adminData).toHaveProperty('is_active');
      expect(adminData.is_active).toBe(true);
      expect(typeof adminData.password_hash).toBe('string');
    });
  });

  describe('Financial Data Creation', () => {
    test('should create valid revenue data', () => {
      const revenueData = TestDataFactory.createRevenueData();
      
      expect(revenueData).toHaveProperty('id');
      expect(revenueData).toHaveProperty('company_id');
      expect(revenueData).toHaveProperty('description');
      expect(revenueData).toHaveProperty('amount');
      expect(typeof revenueData.amount).toBe('number');
    });

    test('should create valid expense data', () => {
      const expenseData = TestDataFactory.createExpenseData();
      
      expect(expenseData).toHaveProperty('id');
      expect(expenseData).toHaveProperty('company_id');
      expect(expenseData).toHaveProperty('description');
      expect(expenseData).toHaveProperty('amount');
      expect(typeof expenseData.amount).toBe('number');
    });

    test('should create valid member data', () => {
      const memberData = TestDataFactory.createMemberData();
      
      expect(memberData).toHaveProperty('id');
      expect(memberData).toHaveProperty('company_id');
      expect(memberData).toHaveProperty('student_id');
      expect(memberData).toHaveProperty('contribution');
      expect(typeof memberData.contribution).toBe('number');
    });

    test('should create valid sale data', () => {
      const saleData = TestDataFactory.createSaleData();
      
      expect(saleData).toHaveProperty('id');
      expect(saleData).toHaveProperty('product_id');
      expect(saleData).toHaveProperty('student_id');
      expect(saleData).toHaveProperty('amount');
      expect(saleData).toHaveProperty('quantity');
      expect(saleData).toHaveProperty('total');
      expect(typeof saleData.amount).toBe('number');
      expect(typeof saleData.quantity).toBe('number');
      expect(typeof saleData.total).toBe('number');
    });
  });

  describe('Data Consistency', () => {
    test('should generate unique IDs for each data creation', () => {
      const student1 = TestDataFactory.createStudentData();
      const student2 = TestDataFactory.createStudentData();
      
      expect(student1.id).not.toBe(student2.id);
    });

    test('should generate unique names for each data creation', () => {
      const company1 = TestDataFactory.createCompanyData();
      const company2 = TestDataFactory.createCompanyData();
      
      expect(company1.name).not.toBe(company2.name);
    });

    test('should maintain data type consistency', () => {
      const studentData = TestDataFactory.createStudentData();
      const companyData = TestDataFactory.createCompanyData();
      const productData = TestDataFactory.createProductData();
      
      // All monetary values should be numbers
      expect(typeof studentData.initial_balance).toBe('number');
      expect(typeof studentData.current_balance).toBe('number');
      expect(typeof companyData.initial_budget).toBe('number');
      expect(typeof companyData.current_budget).toBe('number');
      expect(typeof productData.price).toBe('number');
    });
  });
});