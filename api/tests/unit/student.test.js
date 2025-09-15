import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import Student from '../../model/student.js';
import DatabaseTestUtils from '../helpers/databaseTestUtils.js';
import TestDataFactory from '../helpers/testDataFactory.js';

describe('Student Model', () => {
  let testClassId;
  let testStudentData;

  beforeEach(async () => {
    await DatabaseTestUtils.clearAllTables();
    const seededData = await DatabaseTestUtils.seedTestData();
    testClassId = seededData.classId;
    
    testStudentData = TestDataFactory.createStudentData({
      class_id: testClassId
    });
  });

  afterEach(async () => {
    await DatabaseTestUtils.clearAllTables();
  });

  describe('Constructor', () => {
    test('should create student instance with all fields', () => {
      const student = new Student(testStudentData);
      
      expect(student.id).toBe(testStudentData.id);
      expect(student.name).toBe(testStudentData.name);
      expect(student.class_id).toBe(testStudentData.class_id);
      expect(student.initial_balance).toBe(parseFloat(testStudentData.initial_balance));
      expect(student.current_balance).toBe(parseFloat(testStudentData.current_balance));
    });

    test('should handle monetary fields as numbers', () => {
      const studentData = TestDataFactory.createStudentData({
        initial_balance: '150.50', // String
        current_balance: '125.75'  // String
      });
      
      const student = new Student(studentData);
      
      expect(typeof student.initial_balance).toBe('number');
      expect(typeof student.current_balance).toBe('number');
      expect(student.initial_balance).toBe(150.50);
      expect(student.current_balance).toBe(125.75);
    });

    test('should default monetary fields to 0 when invalid', () => {
      const studentData = TestDataFactory.createStudentData({
        initial_balance: 'invalid',
        current_balance: null
      });
      
      const student = new Student(studentData);
      
      expect(student.initial_balance).toBe(0);
      expect(student.current_balance).toBe(0);
    });
  });

  describe('Static Methods', () => {
    test('getAll should return all students with correct monetary types', async () => {
      // Insert test students
      await DatabaseTestUtils.insertTestRecord('students', testStudentData);
      
      const students = await Student.getAll();
      
      expect(Array.isArray(students)).toBe(true);
      expect(students.length).toBeGreaterThan(0);
      
      students.forEach(student => {
        expect(typeof student.initial_balance).toBe('number');
        expect(typeof student.current_balance).toBe('number');
        expect(student).toHaveProperty('id');
        expect(student).toHaveProperty('name');
        expect(student).toHaveProperty('class_id');
      });
    });

    test('getByClass should return students for specific class', async () => {
      // Insert students for different classes
      const student1 = TestDataFactory.createStudentData({ class_id: testClassId });
      const student2 = TestDataFactory.createStudentData({ class_id: testClassId });
      const student3 = TestDataFactory.createStudentData(); // Different class
      
      await DatabaseTestUtils.insertTestRecord('students', student1);
      await DatabaseTestUtils.insertTestRecord('students', student2);
      await DatabaseTestUtils.insertTestRecord('students', student3);
      
      const classStudents = await Student.getByClass(testClassId);
      
      expect(classStudents.length).toBe(4); // 2 inserted + 2 from seeded data
      classStudents.forEach(student => {
        expect(student.class_id).toBe(testClassId);
        expect(typeof student.initial_balance).toBe('number');
        expect(typeof student.current_balance).toBe('number');
      });
    });

    test('getByClass should return empty array for non-existent class', async () => {
      const nonExistentClassId = 'non-existent-class-id';
      const students = await Student.getByClass(nonExistentClassId);
      
      expect(Array.isArray(students)).toBe(true);
      expect(students.length).toBe(0);
    });
  });

  describe('Instance Methods', () => {
    test('insert should create new student with UUID', async () => {
      const studentData = TestDataFactory.createStudentData({
        class_id: testClassId,
        id: undefined // Test UUID generation
      });
      
      const student = new Student(studentData);
      const result = await student.insert();
      
      expect(result).toBeTruthy();
      expect(student.id).toBeDefined();
      expect(typeof student.id).toBe('string');
      expect(student.id.length).toBe(36); // UUID length
      
      // Verify in database
      const dbRecord = await DatabaseTestUtils.findTestRecord('students', { id: student.id });
      expect(dbRecord.length).toBe(1);
      expect(dbRecord[0].name).toBe(studentData.name);
    });

    test('insert should use provided UUID', async () => {
      const student = new Student(testStudentData);
      await student.insert();
      
      expect(student.id).toBe(testStudentData.id);
      
      // Verify in database
      const dbRecord = await DatabaseTestUtils.findTestRecord('students', { id: testStudentData.id });
      expect(dbRecord.length).toBe(1);
    });

    test('get should retrieve student from database', async () => {
      await DatabaseTestUtils.insertTestRecord('students', testStudentData);
      
      const student = new Student({ id: testStudentData.id });
      await student.get();
      
      expect(student.name).toBe(testStudentData.name);
      expect(student.class_id).toBe(testStudentData.class_id);
      expect(typeof student.initial_balance).toBe('number');
      expect(typeof student.current_balance).toBe('number');
    });

    test('get should throw error for non-existent student', async () => {
      const student = new Student({ id: 'non-existent-id' });
      
      await expect(student.get()).rejects.toThrow('student not found');
    });

    test('update should modify allowed fields', async () => {
      await DatabaseTestUtils.insertTestRecord('students', testStudentData);
      
      const student = new Student({ id: testStudentData.id });
      await student.get();
      
      const updateData = {
        name: 'Updated Student Name',
        current_balance: 200.50,
        class_id: 'should-not-update' // Not in allowUpdate
      };
      
      await student.update(updateData);
      
      expect(student.name).toBe('Updated Student Name');
      expect(student.current_balance).toBe(200.50);
      expect(student.class_id).toBe(testStudentData.class_id); // Should not change
    });

    test('update should fail without ID', async () => {
      const student = new Student(testStudentData);
      student.id = null;
      
      await expect(student.update({ name: 'New Name' })).rejects.toThrow('ID is required for update');
    });

    test('update should fail with no valid fields', async () => {
      await DatabaseTestUtils.insertTestRecord('students', testStudentData);
      
      const student = new Student({ id: testStudentData.id });
      
      await expect(student.update({ invalid_field: 'value' })).rejects.toThrow('No valid fields to update');
    });

    test('delete should remove student from database', async () => {
      await DatabaseTestUtils.insertTestRecord('students', testStudentData);
      
      const student = new Student({ id: testStudentData.id });
      await student.delete();
      
      // Verify deletion
      const dbRecord = await DatabaseTestUtils.findTestRecord('students', { id: testStudentData.id });
      expect(dbRecord.length).toBe(0);
    });

    test('delete should fail without ID', async () => {
      const student = new Student(testStudentData);
      student.id = null;
      
      await expect(student.delete()).rejects.toThrow('ID is required for delete');
    });

    test('toJSON should return clean object representation', () => {
      const student = new Student(testStudentData);
      const json = student.toJSON();
      
      expect(json).toHaveProperty('id', testStudentData.id);
      expect(json).toHaveProperty('name', testStudentData.name);
      expect(json).toHaveProperty('class_id', testStudentData.class_id);
      expect(json).toHaveProperty('initial_balance');
      expect(json).toHaveProperty('current_balance');
      expect(typeof json.initial_balance).toBe('number');
      expect(typeof json.current_balance).toBe('number');
    });
  });

  describe('Balance Operations', () => {
    test('should handle balance updates correctly', async () => {
      await DatabaseTestUtils.insertTestRecord('students', testStudentData);
      
      const student = new Student({ id: testStudentData.id });
      await student.get();
      
      const originalBalance = student.current_balance;
      const newBalance = originalBalance - 25.75;
      
      await student.update({ current_balance: newBalance });
      
      expect(student.current_balance).toBe(newBalance);
      expect(typeof student.current_balance).toBe('number');
      
      // Verify in database
      await student.get(); // Refresh from DB
      expect(student.current_balance).toBe(newBalance);
    });

    test('should handle zero balances', async () => {
      const studentData = TestDataFactory.createStudentData({
        initial_balance: 0,
        current_balance: 0,
        class_id: testClassId
      });
      
      const student = new Student(studentData);
      await student.insert();
      
      expect(student.initial_balance).toBe(0);
      expect(student.current_balance).toBe(0);
      
      // Verify in database
      const dbRecord = await DatabaseTestUtils.findTestRecord('students', { id: student.id });
      expect(parseFloat(dbRecord[0].initial_balance)).toBe(0);
      expect(parseFloat(dbRecord[0].current_balance)).toBe(0);
    });

    test('should handle negative balances', async () => {
      const studentData = TestDataFactory.createStudentData({
        current_balance: -50.25,
        class_id: testClassId
      });
      
      const student = new Student(studentData);
      await student.insert();
      
      expect(student.current_balance).toBe(-50.25);
      
      // Verify in database
      const dbRecord = await DatabaseTestUtils.findTestRecord('students', { id: student.id });
      expect(parseFloat(dbRecord[0].current_balance)).toBe(-50.25);
    });
  });

  describe('Edge Cases', () => {
    test('should handle very long names', async () => {
      const longName = 'A'.repeat(250); // Near database limit
      const studentData = TestDataFactory.createStudentData({
        name: longName,
        class_id: testClassId
      });
      
      const student = new Student(studentData);
      await student.insert();
      
      expect(student.name).toBe(longName);
      
      // Verify in database
      const dbRecord = await DatabaseTestUtils.findTestRecord('students', { id: student.id });
      expect(dbRecord[0].name).toBe(longName);
    });

    test('should handle precision monetary values', async () => {
      const studentData = TestDataFactory.createStudentData({
        initial_balance: 999999.99,
        current_balance: 0.01,
        class_id: testClassId
      });
      
      const student = new Student(studentData);
      await student.insert();
      
      expect(student.initial_balance).toBe(999999.99);
      expect(student.current_balance).toBe(0.01);
      
      // Verify precision is maintained in database
      const dbRecord = await DatabaseTestUtils.findTestRecord('students', { id: student.id });
      expect(parseFloat(dbRecord[0].initial_balance)).toBe(999999.99);
      expect(parseFloat(dbRecord[0].current_balance)).toBe(0.01);
    });

    test('should handle missing created_at field', () => {
      const studentData = { ...testStudentData };
      delete studentData.created_at;
      
      const student = new Student(studentData);
      
      expect(student.name).toBe(testStudentData.name);
      expect(student.created_at).toBeUndefined();
    });
  });
});