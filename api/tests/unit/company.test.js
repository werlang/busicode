import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import Company from '../../model/company.js';
import Student from '../../model/student.js';
import DatabaseTestUtils from '../helpers/databaseTestUtils.js';
import TestDataFactory from '../helpers/testDataFactory.js';

describe('Company Model', () => {
  let testClassId;
  let testCompanyData;
  let testStudentData;

  beforeEach(async () => {
    await DatabaseTestUtils.clearAllTables();
    const seededData = await DatabaseTestUtils.seedTestData();
    testClassId = seededData.classId;
    
    testCompanyData = TestDataFactory.createCompanyData({
      class_id: testClassId
    });
    
    testStudentData = TestDataFactory.createStudentData({
      class_id: testClassId
    });
  });

  afterEach(async () => {
    await DatabaseTestUtils.clearAllTables();
  });

  describe('Constructor', () => {
    test('should create company instance with all fields', () => {
      const company = new Company(testCompanyData);
      
      expect(company.id).toBe(testCompanyData.id);
      expect(company.name).toBe(testCompanyData.name);
      expect(company.class_id).toBe(testCompanyData.class_id);
      expect(company.initial_budget).toBe(parseFloat(testCompanyData.initial_budget));
      expect(company.current_budget).toBe(parseFloat(testCompanyData.current_budget));
    });

    test('should handle monetary fields as numbers', () => {
      const companyData = TestDataFactory.createCompanyData({
        initial_budget: '350.75', // String
        current_budget: '280.50'  // String
      });
      
      const company = new Company(companyData);
      
      expect(typeof company.initial_budget).toBe('number');
      expect(typeof company.current_budget).toBe('number');
      expect(company.initial_budget).toBe(350.75);
      expect(company.current_budget).toBe(280.50);
    });

    test('should default monetary fields to 0 when invalid', () => {
      const companyData = TestDataFactory.createCompanyData({
        initial_budget: 'invalid',
        current_budget: null
      });
      
      const company = new Company(companyData);
      
      expect(company.initial_budget).toBe(0);
      expect(company.current_budget).toBe(0);
    });
  });

  describe('Static Methods', () => {
    test('getAll should return all companies with correct monetary types', async () => {
      await DatabaseTestUtils.insertTestRecord('companies', testCompanyData);
      
      const companies = await Company.getAll();
      
      expect(Array.isArray(companies)).toBe(true);
      expect(companies.length).toBeGreaterThan(0);
      
      companies.forEach(company => {
        expect(typeof company.initial_budget).toBe('number');
        expect(typeof company.current_budget).toBe('number');
        expect(company).toHaveProperty('id');
        expect(company).toHaveProperty('name');
        expect(company).toHaveProperty('class_id');
      });
    });

    test('getByClass should return companies for specific class', async () => {
      // Insert companies for different classes
      const company1 = TestDataFactory.createCompanyData({ class_id: testClassId });
      const company2 = TestDataFactory.createCompanyData({ class_id: testClassId });
      const company3 = TestDataFactory.createCompanyData(); // Different class
      
      await DatabaseTestUtils.insertTestRecord('companies', company1);
      await DatabaseTestUtils.insertTestRecord('companies', company2);
      await DatabaseTestUtils.insertTestRecord('companies', company3);
      
      const classCompanies = await Company.getByClass(testClassId);
      
      expect(classCompanies.length).toBe(3); // 2 inserted + 1 from seeded data
      classCompanies.forEach(company => {
        expect(company.class_id).toBe(testClassId);
        expect(typeof company.initial_budget).toBe('number');
        expect(typeof company.current_budget).toBe('number');
      });
    });

    test('getByClass should return empty array for non-existent class', async () => {
      const nonExistentClassId = 'non-existent-class-id';
      const companies = await Company.getByClass(nonExistentClassId);
      
      expect(Array.isArray(companies)).toBe(true);
      expect(companies.length).toBe(0);
    });
  });

  describe('Instance Methods', () => {
    test('insert should create new company with UUID', async () => {
      const companyData = TestDataFactory.createCompanyData({
        class_id: testClassId,
        id: undefined // Test UUID generation
      });
      
      const company = new Company(companyData);
      const result = await company.insert();
      
      expect(result).toBeTruthy();
      expect(company.id).toBeDefined();
      expect(typeof company.id).toBe('string');
      expect(company.id.length).toBe(36); // UUID length
      
      // Verify in database
      const dbRecord = await DatabaseTestUtils.findTestRecord('companies', { id: company.id });
      expect(dbRecord.length).toBe(1);
      expect(dbRecord[0].name).toBe(companyData.name);
    });

    test('insert should use provided UUID', async () => {
      const company = new Company(testCompanyData);
      await company.insert();
      
      expect(company.id).toBe(testCompanyData.id);
      
      // Verify in database
      const dbRecord = await DatabaseTestUtils.findTestRecord('companies', { id: testCompanyData.id });
      expect(dbRecord.length).toBe(1);
    });

    test('update should modify allowed fields', async () => {
      await DatabaseTestUtils.insertTestRecord('companies', testCompanyData);
      
      const company = new Company({ id: testCompanyData.id });
      await company.get();
      
      const updateData = {
        name: 'Updated Company Name',
        current_budget: 350.25,
        class_id: 'should-not-update' // Not in allowUpdate
      };
      
      await company.update(updateData);
      
      expect(company.name).toBe('Updated Company Name');
      expect(company.current_budget).toBe(350.25);
      expect(company.class_id).toBe(testCompanyData.class_id); // Should not change
    });
  });

  describe('Member Management', () => {
    beforeEach(async () => {
      await DatabaseTestUtils.insertTestRecord('companies', testCompanyData);
      await DatabaseTestUtils.insertTestRecord('students', testStudentData);
    });

    test('getMembers should return all company members', async () => {
      // Add member to company
      const memberData = TestDataFactory.createMemberData({
        company_id: testCompanyData.id,
        student_id: testStudentData.id,
        contribution: 75.00
      });
      
      await DatabaseTestUtils.insertTestRecord('company_members', memberData);
      
      const company = new Company({ id: testCompanyData.id });
      const members = await company.getMembers();
      
      expect(Array.isArray(members)).toBe(true);
      expect(members.length).toBe(1);
      expect(members[0].company_id).toBe(testCompanyData.id);
      expect(members[0].student_id).toBe(testStudentData.id);
      expect(typeof members[0].contribution).toBe('number');
    });

    test('addMember should add student to company', async () => {
      const company = new Company({ id: testCompanyData.id });
      const contribution = 50.00;
      
      const member = await company.addMember(testStudentData.id, contribution);
      
      expect(member).toBeDefined();
      expect(member.company_id).toBe(testCompanyData.id);
      expect(member.student_id).toBe(testStudentData.id);
      expect(member.contribution).toBe(contribution);
      
      // Verify in database
      const dbRecord = await DatabaseTestUtils.findTestRecord('company_members', {
        company_id: testCompanyData.id,
        student_id: testStudentData.id
      });
      expect(dbRecord.length).toBe(1);
    });

    test('addMember should fail with duplicate member', async () => {
      const company = new Company({ id: testCompanyData.id });
      
      // Add member first time
      await company.addMember(testStudentData.id, 50.00);
      
      // Try to add same member again
      await expect(company.addMember(testStudentData.id, 25.00))
        .rejects.toThrow('Student is already a member of this company');
    });

    test('addMember should validate sufficient student balance', async () => {
      // Update student balance to be insufficient
      const student = new Student({ id: testStudentData.id });
      await student.get();
      await student.update({ current_balance: 25.00 });
      
      const company = new Company({ id: testCompanyData.id });
      
      // Try to add member with contribution exceeding balance
      await expect(company.addMember(testStudentData.id, 50.00))
        .rejects.toThrow('Student does not have sufficient balance');
    });

    test('addMember should update student balance and company budget', async () => {
      const company = new Company({ id: testCompanyData.id });
      await company.get();
      
      const student = new Student({ id: testStudentData.id });
      await student.get();
      
      const originalStudentBalance = student.current_balance;
      const originalCompanyBudget = company.current_budget;
      const contribution = 30.00;
      
      await company.addMember(testStudentData.id, contribution);
      
      // Refresh from database
      await student.get();
      await company.get();
      
      expect(student.current_balance).toBe(originalStudentBalance - contribution);
      expect(company.current_budget).toBe(originalCompanyBudget + contribution);
    });

    test('removeMember should remove student from company', async () => {
      const company = new Company({ id: testCompanyData.id });
      
      // Add member first
      await company.addMember(testStudentData.id, 40.00);
      
      // Remove member
      await company.removeMember(testStudentData.id);
      
      // Verify removal
      const dbRecord = await DatabaseTestUtils.findTestRecord('company_members', {
        company_id: testCompanyData.id,
        student_id: testStudentData.id
      });
      expect(dbRecord.length).toBe(0);
    });

    test('removeMember should fail for non-existent member', async () => {
      const company = new Company({ id: testCompanyData.id });
      
      await expect(company.removeMember('non-existent-student-id'))
        .rejects.toThrow('Student is not a member of this company');
    });
  });

  describe('Financial Operations', () => {
    beforeEach(async () => {
      await DatabaseTestUtils.insertTestRecord('companies', testCompanyData);
    });

    test('addRevenue should increase budget and record transaction', async () => {
      const company = new Company({ id: testCompanyData.id });
      await company.get();
      
      const originalBudget = company.current_budget;
      const revenueAmount = 150.00;
      const description = 'Test revenue';
      
      const revenue = await company.addRevenue(description, revenueAmount);
      
      expect(revenue).toBeDefined();
      expect(revenue.amount).toBe(revenueAmount);
      expect(revenue.description).toBe(description);
      expect(company.current_budget).toBe(originalBudget + revenueAmount);
      
      // Verify in database
      const dbRecord = await DatabaseTestUtils.findTestRecord('company_revenues', {
        company_id: testCompanyData.id
      });
      expect(dbRecord.length).toBe(1);
      expect(parseFloat(dbRecord[0].amount)).toBe(revenueAmount);
    });

    test('addExpense should decrease budget and record transaction', async () => {
      const company = new Company({ id: testCompanyData.id });
      await company.get();
      
      const originalBudget = company.current_budget;
      const expenseAmount = 75.00;
      const description = 'Test expense';
      
      const expense = await company.addExpense(description, expenseAmount);
      
      expect(expense).toBeDefined();
      expect(expense.amount).toBe(expenseAmount);
      expect(expense.description).toBe(description);
      expect(company.current_budget).toBe(originalBudget - expenseAmount);
      
      // Verify in database
      const dbRecord = await DatabaseTestUtils.findTestRecord('company_expenses', {
        company_id: testCompanyData.id
      });
      expect(dbRecord.length).toBe(1);
      expect(parseFloat(dbRecord[0].amount)).toBe(expenseAmount);
    });

    test('addExpense should fail with insufficient budget', async () => {
      const company = new Company({ id: testCompanyData.id });
      await company.get();
      
      const excessiveAmount = company.current_budget + 100.00;
      
      await expect(company.addExpense('Excessive expense', excessiveAmount))
        .rejects.toThrow('Insufficient company budget');
    });

    test('getFinancialHistory should return all transactions', async () => {
      const company = new Company({ id: testCompanyData.id });
      
      // Add some transactions
      await company.addRevenue('Revenue 1', 100.00);
      await company.addExpense('Expense 1', 50.00);
      await company.addRevenue('Revenue 2', 75.00);
      
      const history = await company.getFinancialHistory();
      
      expect(history).toBeDefined();
      expect(history.revenues).toHaveLength(2);
      expect(history.expenses).toHaveLength(1);
      
      // Check revenue entries
      expect(history.revenues[0].description).toBe('Revenue 1');
      expect(history.revenues[0].amount).toBe(100.00);
      expect(history.revenues[1].description).toBe('Revenue 2');
      expect(history.revenues[1].amount).toBe(75.00);
      
      // Check expense entries
      expect(history.expenses[0].description).toBe('Expense 1');
      expect(history.expenses[0].amount).toBe(50.00);
    });

    test('getFinancialSummary should calculate correct totals', async () => {
      const company = new Company({ id: testCompanyData.id });
      
      // Add transactions
      await company.addRevenue('Revenue 1', 150.00);
      await company.addRevenue('Revenue 2', 100.00);
      await company.addExpense('Expense 1', 75.00);
      await company.addExpense('Expense 2', 25.00);
      
      const summary = await company.getFinancialSummary();
      
      expect(summary.totalRevenues).toBe(250.00);
      expect(summary.totalExpenses).toBe(100.00);
      expect(summary.netProfit).toBe(150.00);
      expect(summary.revenueCount).toBe(2);
      expect(summary.expenseCount).toBe(2);
    });
  });

  describe('Business Logic Edge Cases', () => {
    beforeEach(async () => {
      await DatabaseTestUtils.insertTestRecord('companies', testCompanyData);
      await DatabaseTestUtils.insertTestRecord('students', testStudentData);
    });

    test('should handle zero contribution member addition', async () => {
      const company = new Company({ id: testCompanyData.id });
      
      const member = await company.addMember(testStudentData.id, 0.00);
      
      expect(member.contribution).toBe(0.00);
      
      // Verify balances unchanged
      const student = new Student({ id: testStudentData.id });
      await student.get();
      expect(student.current_balance).toBe(testStudentData.current_balance);
      
      await company.get();
      expect(company.current_budget).toBe(testCompanyData.current_budget);
    });

    test('should handle exact balance contribution', async () => {
      const student = new Student({ id: testStudentData.id });
      await student.get();
      
      const exactBalance = student.current_balance;
      
      const company = new Company({ id: testCompanyData.id });
      await company.addMember(testStudentData.id, exactBalance);
      
      // Student should have zero balance
      await student.get();
      expect(student.current_balance).toBe(0);
      
      // Company should receive full contribution
      await company.get();
      expect(company.current_budget).toBe(testCompanyData.current_budget + exactBalance);
    });

    test('should handle negative amounts gracefully', async () => {
      const company = new Company({ id: testCompanyData.id });
      
      await expect(company.addRevenue('Negative revenue', -100.00))
        .rejects.toThrow('Amount must be positive');
        
      await expect(company.addExpense('Negative expense', -50.00))
        .rejects.toThrow('Amount must be positive');
    });

    test('should handle concurrent member additions', async () => {
      // Create multiple students
      const student2Data = TestDataFactory.createStudentData({ class_id: testClassId });
      await DatabaseTestUtils.insertTestRecord('students', student2Data);
      
      const company = new Company({ id: testCompanyData.id });
      
      // Try to add members concurrently
      const [member1, member2] = await Promise.all([
        company.addMember(testStudentData.id, 30.00),
        company.addMember(student2Data.id, 40.00)
      ]);
      
      expect(member1).toBeDefined();
      expect(member2).toBeDefined();
      
      // Verify both members exist
      const members = await company.getMembers();
      expect(members.length).toBe(2);
    });

    test('should maintain data consistency with multiple financial operations', async () => {
      const company = new Company({ id: testCompanyData.id });
      await company.get();
      
      const initialBudget = company.current_budget;
      
      // Perform multiple operations
      await company.addRevenue('Revenue 1', 100.00);
      await company.addExpense('Expense 1', 30.00);
      await company.addRevenue('Revenue 2', 50.00);
      await company.addExpense('Expense 2', 20.00);
      
      // Calculate expected budget
      const expectedBudget = initialBudget + 100.00 - 30.00 + 50.00 - 20.00;
      
      await company.get(); // Refresh from database
      expect(company.current_budget).toBe(expectedBudget);
      
      // Verify through financial summary
      const summary = await company.getFinancialSummary();
      expect(summary.netProfit).toBe(100.00); // 150 revenue - 50 expenses
    });
  });

  describe('Monetary Precision', () => {
    beforeEach(async () => {
      await DatabaseTestUtils.insertTestRecord('companies', testCompanyData);
    });

    test('should handle precise decimal calculations', async () => {
      const company = new Company({ id: testCompanyData.id });
      
      // Add revenue with precise decimals
      await company.addRevenue('Precise revenue', 123.456);
      
      // The system should handle 2 decimal places
      await company.get();
      expect(company.current_budget).toBeCloseTo(testCompanyData.current_budget + 123.46, 2);
    });

    test('should handle large monetary values', async () => {
      const company = new Company({ id: testCompanyData.id });
      const largeAmount = 999999.99;
      
      await company.addRevenue('Large revenue', largeAmount);
      
      await company.get();
      expect(company.current_budget).toBeCloseTo(testCompanyData.current_budget + largeAmount, 2);
      
      // Verify in database
      const dbRecord = await DatabaseTestUtils.findTestRecord('companies', { id: testCompanyData.id });
      expect(parseFloat(dbRecord[0].current_budget)).toBeCloseTo(testCompanyData.current_budget + largeAmount, 2);
    });

    test('should handle very small monetary values', async () => {
      const company = new Company({ id: testCompanyData.id });
      const smallAmount = 0.01;
      
      await company.addRevenue('Small revenue', smallAmount);
      
      await company.get();
      expect(company.current_budget).toBeCloseTo(testCompanyData.current_budget + smallAmount, 2);
    });
  });

  describe('toJSON Methods', () => {
    test('should return clean object representation', () => {
      const company = new Company(testCompanyData);
      const json = company.toJSON();
      
      expect(json).toHaveProperty('id', testCompanyData.id);
      expect(json).toHaveProperty('name', testCompanyData.name);
      expect(json).toHaveProperty('class_id', testCompanyData.class_id);
      expect(json).toHaveProperty('initial_budget');
      expect(json).toHaveProperty('current_budget');
      expect(typeof json.initial_budget).toBe('number');
      expect(typeof json.current_budget).toBe('number');
    });

    test('should include members and products in detailed JSON', async () => {
      await DatabaseTestUtils.insertTestRecord('companies', testCompanyData);
      await DatabaseTestUtils.insertTestRecord('students', testStudentData);
      
      const company = new Company({ id: testCompanyData.id });
      
      // Add member
      await company.addMember(testStudentData.id, 50.00);
      
      // Add product
      const productData = TestDataFactory.createProductData({ company_id: testCompanyData.id });
      await DatabaseTestUtils.insertTestRecord('products', productData);
      
      const detailedJson = await company.toJSONWithDetails();
      
      expect(detailedJson).toHaveProperty('members');
      expect(detailedJson).toHaveProperty('products');
      expect(Array.isArray(detailedJson.members)).toBe(true);
      expect(Array.isArray(detailedJson.products)).toBe(true);
      expect(detailedJson.members.length).toBe(1);
      expect(detailedJson.products.length).toBe(1);
    });
  });
});