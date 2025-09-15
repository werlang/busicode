import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import Class from '../../model/class.js';
import Student from '../../model/student.js';
import DatabaseTestUtils from '../helpers/databaseTestUtils.js';
import TestDataFactory from '../helpers/testDataFactory.js';

describe('Class Model', () => {
  let testClassData;

  beforeEach(async () => {
    await DatabaseTestUtils.clearAllTables();
    await DatabaseTestUtils.seedTestData();
    
    testClassData = TestDataFactory.createClassData();
  });

  afterEach(async () => {
    await DatabaseTestUtils.clearAllTables();
  });

  describe('Constructor', () => {
    test('should create class instance with all fields', () => {
      const classInstance = new Class(testClassData);
      
      expect(classInstance.id).toBe(testClassData.id);
      expect(classInstance.name).toBe(testClassData.name);
      expect(classInstance.created_at).toBe(testClassData.created_at);
    });

    test('should handle undefined fields gracefully', () => {
      const classData = { name: 'Test Class' };
      const classInstance = new Class(classData);
      
      expect(classInstance.name).toBe('Test Class');
      expect(classInstance.id).toBeUndefined();
      expect(classInstance.created_at).toBeUndefined();
    });
  });

  describe('Static Methods', () => {
    test('getAll should return all classes', async () => {
      await DatabaseTestUtils.insertTestRecord('classes', testClassData);
      
      const classes = await Class.getAll();
      
      expect(Array.isArray(classes)).toBe(true);
      expect(classes.length).toBeGreaterThan(0);
      
      const testClass = classes.find(c => c.id === testClassData.id);
      expect(testClass).toBeDefined();
      expect(testClass.name).toBe(testClassData.name);
    });

    test('getAll should apply filters correctly', async () => {
      await DatabaseTestUtils.insertTestRecord('classes', testClassData);
      
      const classes = await Class.getAll({ name: testClassData.name });
      
      expect(classes.length).toBe(1);
      expect(classes[0].name).toBe(testClassData.name);
    });

    test('getAll should return empty array when no classes exist', async () => {
      await DatabaseTestUtils.clearAllTables();
      
      const classes = await Class.getAll();
      
      expect(Array.isArray(classes)).toBe(true);
      expect(classes.length).toBe(0);
    });
  });

  describe('Instance Methods', () => {
    describe('insert', () => {
      test('should create new class with UUID', async () => {
        const classData = TestDataFactory.createClassData({ id: undefined });
        const classInstance = new Class(classData);
        
        const result = await classInstance.insert();
        
        expect(result).toBeTruthy();
        expect(classInstance.id).toBeDefined();
        expect(typeof classInstance.id).toBe('string');
        expect(classInstance.id.length).toBe(36); // UUID length
        
        // Verify in database
        const dbRecord = await DatabaseTestUtils.findTestRecord('classes', { id: classInstance.id });
        expect(dbRecord.length).toBe(1);
        expect(dbRecord[0].name).toBe(classData.name);
      });

      test('should use provided UUID', async () => {
        const classInstance = new Class(testClassData);
        await classInstance.insert();
        
        expect(classInstance.id).toBe(testClassData.id);
        
        // Verify in database
        const dbRecord = await DatabaseTestUtils.findTestRecord('classes', { id: testClassData.id });
        expect(dbRecord.length).toBe(1);
      });

      test('should preserve insert fields after operation', async () => {
        const classInstance = new Class(testClassData);
        const originalInsertFields = [...classInstance.insertFields];
        
        await classInstance.insert();
        
        expect(classInstance.insertFields).toEqual(originalInsertFields);
      });
    });

    describe('getStudents', () => {
      test('should return all students in class', async () => {
        await DatabaseTestUtils.insertTestRecord('classes', testClassData);
        
        // Add students to class
        const student1 = TestDataFactory.createStudentData({ class_id: testClassData.id });
        const student2 = TestDataFactory.createStudentData({ class_id: testClassData.id });
        
        await DatabaseTestUtils.insertTestRecord('students', student1);
        await DatabaseTestUtils.insertTestRecord('students', student2);
        
        const classInstance = new Class({ id: testClassData.id });
        const students = await classInstance.getStudents();
        
        expect(Array.isArray(students)).toBe(true);
        expect(students.length).toBe(2);
        students.forEach(student => {
          expect(student.class_id).toBe(testClassData.id);
        });
      });

      test('should return empty array when no students exist', async () => {
        await DatabaseTestUtils.insertTestRecord('classes', testClassData);
        
        const classInstance = new Class({ id: testClassData.id });
        const students = await classInstance.getStudents();
        
        expect(Array.isArray(students)).toBe(true);
        expect(students.length).toBe(0);
      });
    });

    describe('addStudent', () => {
      beforeEach(async () => {
        await DatabaseTestUtils.insertTestRecord('classes', testClassData);
      });

      test('should add student to class', async () => {
        const classInstance = new Class({ id: testClassData.id });
        const studentData = {
          name: 'New Student',
          initial_balance: 150.00,
          current_balance: 150.00
        };
        
        const student = await classInstance.addStudent(studentData);
        
        expect(student).toBeInstanceOf(Student);
        expect(student.name).toBe('New Student');
        expect(student.class_id).toBe(testClassData.id);
        expect(student.initial_balance).toBe(150.00);
        
        // Verify in database
        const dbRecord = await DatabaseTestUtils.findTestRecord('students', { id: student.id });
        expect(dbRecord.length).toBe(1);
        expect(dbRecord[0].class_id).toBe(testClassData.id);
      });

      test('should override class_id if provided in studentData', async () => {
        const classInstance = new Class({ id: testClassData.id });
        const studentData = {
          name: 'New Student',
          class_id: 'different-class-id', // Should be overridden
          initial_balance: 100.00,
          current_balance: 100.00
        };
        
        const student = await classInstance.addStudent(studentData);
        
        expect(student.class_id).toBe(testClassData.id); // Should use class instance ID
      });
    });

    describe('getStats', () => {
      beforeEach(async () => {
        await DatabaseTestUtils.insertTestRecord('classes', testClassData);
      });

      test('should return correct statistics for class with students', async () => {
        // Add students with known balances
        const student1 = TestDataFactory.createStudentData({
          class_id: testClassData.id,
          initial_balance: 100.00,
          current_balance: 80.00
        });
        const student2 = TestDataFactory.createStudentData({
          class_id: testClassData.id,
          initial_balance: 200.00,
          current_balance: 150.00
        });
        
        await DatabaseTestUtils.insertTestRecord('students', student1);
        await DatabaseTestUtils.insertTestRecord('students', student2);
        
        const classInstance = new Class({ id: testClassData.id });
        const stats = await classInstance.getStats();
        
        expect(stats.totalStudents).toBe(2);
        expect(stats.totalInitialBalance).toBe(300.00);
        expect(stats.totalCurrentBalance).toBe(230.00);
        expect(stats.averageInitialBalance).toBe(150.00);
        expect(stats.averageCurrentBalance).toBe(115.00);
      });

      test('should return zero statistics for empty class', async () => {
        const classInstance = new Class({ id: testClassData.id });
        const stats = await classInstance.getStats();
        
        expect(stats.totalStudents).toBe(0);
        expect(stats.totalInitialBalance).toBe(0);
        expect(stats.totalCurrentBalance).toBe(0);
        expect(stats.averageInitialBalance).toBe(0);
        expect(stats.averageCurrentBalance).toBe(0);
      });

      test('should handle null balances gracefully', async () => {
        const studentWithNullBalance = TestDataFactory.createStudentData({
          class_id: testClassData.id,
          initial_balance: null,
          current_balance: null
        });
        
        await DatabaseTestUtils.insertTestRecord('students', studentWithNullBalance);
        
        const classInstance = new Class({ id: testClassData.id });
        const stats = await classInstance.getStats();
        
        expect(stats.totalStudents).toBe(1);
        expect(stats.totalInitialBalance).toBe(0);
        expect(stats.totalCurrentBalance).toBe(0);
        expect(stats.averageInitialBalance).toBe(0);
        expect(stats.averageCurrentBalance).toBe(0);
      });

      test('should handle precision monetary calculations', async () => {
        // Add students with precise decimal balances
        const student1 = TestDataFactory.createStudentData({
          class_id: testClassData.id,
          initial_balance: 33.33,
          current_balance: 22.22
        });
        const student2 = TestDataFactory.createStudentData({
          class_id: testClassData.id,
          initial_balance: 66.67,
          current_balance: 44.45
        });
        
        await DatabaseTestUtils.insertTestRecord('students', student1);
        await DatabaseTestUtils.insertTestRecord('students', student2);
        
        const classInstance = new Class({ id: testClassData.id });
        const stats = await classInstance.getStats();
        
        expect(stats.totalStudents).toBe(2);
        expect(stats.totalInitialBalance).toBeCloseTo(100.00, 2);
        expect(stats.totalCurrentBalance).toBeCloseTo(66.67, 2);
        expect(stats.averageInitialBalance).toBeCloseTo(50.00, 2);
        expect(stats.averageCurrentBalance).toBeCloseTo(33.335, 2);
      });
    });

    describe('resetAllStudentBalances', () => {
      beforeEach(async () => {
        await DatabaseTestUtils.insertTestRecord('classes', testClassData);
      });

      test('should reset all student balances in class', async () => {
        // Add students with modified balances
        const student1 = TestDataFactory.createStudentData({
          class_id: testClassData.id,
          initial_balance: 100.00,
          current_balance: 50.00 // Modified balance
        });
        const student2 = TestDataFactory.createStudentData({
          class_id: testClassData.id,
          initial_balance: 200.00,
          current_balance: 75.00 // Modified balance
        });
        
        await DatabaseTestUtils.insertTestRecord('students', student1);
        await DatabaseTestUtils.insertTestRecord('students', student2);
        
        const classInstance = new Class({ id: testClassData.id });
        const updatedStudents = await classInstance.resetAllStudentBalances();
        
        expect(Array.isArray(updatedStudents)).toBe(true);
        expect(updatedStudents.length).toBe(2);
        
        updatedStudents.forEach(student => {
          expect(student).toBeInstanceOf(Student);
          expect(student.current_balance).toBe(student.initial_balance);
        });
      });

      test('should handle empty class gracefully', async () => {
        const classInstance = new Class({ id: testClassData.id });
        const updatedStudents = await classInstance.resetAllStudentBalances();
        
        expect(Array.isArray(updatedStudents)).toBe(true);
        expect(updatedStudents.length).toBe(0);
      });
    });

    describe('toJSON', () => {
      test('should return clean object representation', () => {
        const classInstance = new Class(testClassData);
        const json = classInstance.toJSON();
        
        expect(json).toHaveProperty('id', testClassData.id);
        expect(json).toHaveProperty('name', testClassData.name);
        expect(json).toHaveProperty('createdAt', testClassData.created_at);
        expect(json).not.toHaveProperty('created_at'); // Should use camelCase
        expect(json).not.toHaveProperty('table');
        expect(json).not.toHaveProperty('fields');
      });

      test('should handle missing fields', () => {
        const classData = { name: 'Test Class' };
        const classInstance = new Class(classData);
        const json = classInstance.toJSON();
        
        expect(json).toHaveProperty('name', 'Test Class');
        expect(json).toHaveProperty('id', undefined);
        expect(json).toHaveProperty('createdAt', undefined);
      });
    });

    describe('toJSONWithStudents', () => {
      beforeEach(async () => {
        await DatabaseTestUtils.insertTestRecord('classes', testClassData);
      });

      test('should include students in JSON representation', async () => {
        // Add students to class
        const student1 = TestDataFactory.createStudentData({ class_id: testClassData.id });
        const student2 = TestDataFactory.createStudentData({ class_id: testClassData.id });
        
        await DatabaseTestUtils.insertTestRecord('students', student1);
        await DatabaseTestUtils.insertTestRecord('students', student2);
        
        const classInstance = new Class(testClassData);
        const json = await classInstance.toJSONWithStudents();
        
        expect(json).toHaveProperty('id', testClassData.id);
        expect(json).toHaveProperty('name', testClassData.name);
        expect(json).toHaveProperty('students');
        expect(Array.isArray(json.students)).toBe(true);
        expect(json.students.length).toBe(2);
        
        json.students.forEach(student => {
          expect(student).toHaveProperty('id');
          expect(student).toHaveProperty('name');
          expect(student).toHaveProperty('class_id', testClassData.id);
          expect(typeof student.initial_balance).toBe('number');
          expect(typeof student.current_balance).toBe('number');
        });
      });

      test('should include empty students array for empty class', async () => {
        const classInstance = new Class(testClassData);
        const json = await classInstance.toJSONWithStudents();
        
        expect(json).toHaveProperty('students');
        expect(Array.isArray(json.students)).toBe(true);
        expect(json.students.length).toBe(0);
      });
    });
  });

  describe('Edge Cases', () => {
    test('should handle very long class names', async () => {
      const longName = 'A'.repeat(250); // Near database limit
      const classData = TestDataFactory.createClassData({ name: longName });
      
      const classInstance = new Class(classData);
      await classInstance.insert();
      
      expect(classInstance.name).toBe(longName);
      
      // Verify in database
      const dbRecord = await DatabaseTestUtils.findTestRecord('classes', { id: classInstance.id });
      expect(dbRecord[0].name).toBe(longName);
    });

    test('should handle special characters in class names', async () => {
      const specialName = "Class with 'quotes' and \"double quotes\" and symbols @#$%";
      const classData = TestDataFactory.createClassData({ name: specialName });
      
      const classInstance = new Class(classData);
      await classInstance.insert();
      
      expect(classInstance.name).toBe(specialName);
      
      // Verify in database
      const dbRecord = await DatabaseTestUtils.findTestRecord('classes', { id: classInstance.id });
      expect(dbRecord[0].name).toBe(specialName);
    });

    test('should handle concurrent class operations', async () => {
      const class1 = new Class(TestDataFactory.createClassData({ name: 'Concurrent Class 1' }));
      const class2 = new Class(TestDataFactory.createClassData({ name: 'Concurrent Class 2' }));
      
      // Concurrent inserts should both succeed
      const [result1, result2] = await Promise.all([
        class1.insert(),
        class2.insert()
      ]);
      
      expect(result1).toBeTruthy();
      expect(result2).toBeTruthy();
      
      // Verify both classes exist
      const dbRecord1 = await DatabaseTestUtils.findTestRecord('classes', { id: class1.id });
      const dbRecord2 = await DatabaseTestUtils.findTestRecord('classes', { id: class2.id });
      
      expect(dbRecord1.length).toBe(1);
      expect(dbRecord2.length).toBe(1);
    });

    test('should handle large number of students in statistics', async () => {
      await DatabaseTestUtils.insertTestRecord('classes', testClassData);
      
      // Add many students
      const students = [];
      for (let i = 0; i < 100; i++) {
        students.push(TestDataFactory.createStudentData({
          class_id: testClassData.id,
          initial_balance: 100.00 + i,
          current_balance: 90.00 + i
        }));
      }
      
      // Insert all students
      for (const student of students) {
        await DatabaseTestUtils.insertTestRecord('students', student);
      }
      
      const classInstance = new Class({ id: testClassData.id });
      const stats = await classInstance.getStats();
      
      expect(stats.totalStudents).toBe(100);
      expect(stats.totalInitialBalance).toBeCloseTo(14950.00, 2); // Sum of 100-199
      expect(stats.totalCurrentBalance).toBeCloseTo(13950.00, 2); // Sum of 90-189
      expect(stats.averageInitialBalance).toBeCloseTo(149.50, 2);
      expect(stats.averageCurrentBalance).toBeCloseTo(139.50, 2);
    });
  });

  describe('Integration with Student Model', () => {
    beforeEach(async () => {
      await DatabaseTestUtils.insertTestRecord('classes', testClassData);
    });

    test('should properly handle student creation through addStudent', async () => {
      const classInstance = new Class({ id: testClassData.id });
      const studentData = {
        name: 'Integration Test Student',
        initial_balance: 125.50,
        current_balance: 125.50
      };
      
      const student = await classInstance.addStudent(studentData);
      
      // Verify student exists and is linked to class
      const dbStudent = await DatabaseTestUtils.findTestRecord('students', { id: student.id });
      expect(dbStudent.length).toBe(1);
      expect(dbStudent[0].class_id).toBe(testClassData.id);
      
      // Verify class can retrieve the student
      const classStudents = await classInstance.getStudents();
      const createdStudent = classStudents.find(s => s.id === student.id);
      expect(createdStudent).toBeDefined();
      expect(createdStudent.name).toBe('Integration Test Student');
    });

    test('should maintain data consistency in statistics', async () => {
      const classInstance = new Class({ id: testClassData.id });
      
      // Add students through the class
      await classInstance.addStudent({
        name: 'Student 1',
        initial_balance: 100.00,
        current_balance: 85.00
      });
      
      await classInstance.addStudent({
        name: 'Student 2',
        initial_balance: 200.00,
        current_balance: 175.00
      });
      
      // Get statistics
      const stats = await classInstance.getStats();
      
      expect(stats.totalStudents).toBe(2);
      expect(stats.totalInitialBalance).toBe(300.00);
      expect(stats.totalCurrentBalance).toBe(260.00);
      
      // Verify through direct student retrieval
      const students = await classInstance.getStudents();
      const manualTotal = students.reduce((sum, s) => sum + s.current_balance, 0);
      expect(manualTotal).toBe(stats.totalCurrentBalance);
    });
  });
});