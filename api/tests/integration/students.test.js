import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import request from 'supertest';
import app from '../../app.js';
import DatabaseTestUtils from '../helpers/databaseTestUtils.js';
import TestDataFactory from '../helpers/testDataFactory.js';

describe('Student Routes', () => {
  let validToken;
  let testClassId;
  let testStudentData;

  beforeEach(async () => {
    await DatabaseTestUtils.clearAllTables();
    const seededData = await DatabaseTestUtils.seedTestData();
    testClassId = seededData.classId;
    
    validToken = TestDataFactory.createJWTToken();
    testStudentData = TestDataFactory.createStudentData({
      class_id: testClassId
    });
  });

  afterEach(async () => {
    await DatabaseTestUtils.clearAllTables();
  });

  describe('GET /students', () => {
    test('should get all students without authentication', async () => {
      await DatabaseTestUtils.insertTestRecord('students', testStudentData);

      const response = await request(app)
        .get('/students');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('students');
      expect(Array.isArray(response.body.students)).toBe(true);
      expect(response.body.students.length).toBeGreaterThan(0);
      
      response.body.students.forEach(student => {
        expect(student).toHaveProperty('id');
        expect(student).toHaveProperty('name');
        expect(typeof student.initial_balance).toBe('number');
        expect(typeof student.current_balance).toBe('number');
      });
    });

    test('should filter students by class_id', async () => {
      const otherClassId = 'other-class-id';
      await DatabaseTestUtils.insertTestRecord('classes', { id: otherClassId, name: 'Other Class' });
      
      const student1 = TestDataFactory.createStudentData({ class_id: testClassId });
      const student2 = TestDataFactory.createStudentData({ class_id: otherClassId });
      
      await DatabaseTestUtils.insertTestRecord('students', student1);
      await DatabaseTestUtils.insertTestRecord('students', student2);

      const response = await request(app)
        .get('/students')
        .query({ class_id: testClassId });

      expect(response.status).toBe(200);
      expect(response.body.students.length).toBe(3); // 2 seeded + 1 inserted
      response.body.students.forEach(student => {
        expect(student.class_id).toBe(testClassId);
      });
    });

    test('should return empty array when no students exist', async () => {
      await DatabaseTestUtils.clearAllTables();
      await DatabaseTestUtils.seedTestData(); // Only creates admin and class

      const response = await request(app)
        .get('/students');

      expect(response.status).toBe(200);
      expect(response.body.students).toEqual([]);
    });
  });

  describe('GET /students/:id', () => {
    test('should get student by ID without authentication', async () => {
      await DatabaseTestUtils.insertTestRecord('students', testStudentData);

      const response = await request(app)
        .get(`/students/${testStudentData.id}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('student');
      expect(response.body.student.id).toBe(testStudentData.id);
      expect(response.body.student.name).toBe(testStudentData.name);
      expect(typeof response.body.student.initial_balance).toBe('number');
      expect(typeof response.body.student.current_balance).toBe('number');
    });

    test('should return 404 for non-existent student', async () => {
      const response = await request(app)
        .get('/students/non-existent-id');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', true);
    });
  });

  describe('POST /students', () => {
    test('should create student with valid authentication', async () => {
      const newStudentData = {
        name: 'New Test Student',
        classId: testClassId,
        initialBalance: 150.50
      };

      const response = await request(app)
        .post('/students')
        .set('Authorization', `Bearer ${validToken}`)
        .send(newStudentData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('message', 'Student created successfully');
      expect(response.body).toHaveProperty('student');
      expect(response.body.student.name).toBe(newStudentData.name);
      expect(response.body.student.initial_balance).toBe(150.50);
      expect(response.body.student.current_balance).toBe(150.50);
    });

    test('should fail without authentication', async () => {
      const newStudentData = {
        name: 'New Test Student',
        classId: testClassId,
        initialBalance: 100.00
      };

      const response = await request(app)
        .post('/students')
        .send(newStudentData);

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error', true);
      expect(response.body).toHaveProperty('message', 'Access token required');
    });

    test('should fail with missing name', async () => {
      const invalidStudentData = {
        classId: testClassId,
        initialBalance: 100.00
      };

      const response = await request(app)
        .post('/students')
        .set('Authorization', `Bearer ${validToken}`)
        .send(invalidStudentData);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', true);
      expect(response.body).toHaveProperty('message', 'Name is required');
    });

    test('should default balance when not provided', async () => {
      const studentData = {
        name: 'Student Without Balance',
        classId: testClassId
      };

      const response = await request(app)
        .post('/students')
        .set('Authorization', `Bearer ${validToken}`)
        .send(studentData);

      expect(response.status).toBe(201);
      expect(response.body.student.initial_balance).toBe(0);
      expect(response.body.student.current_balance).toBe(0);
    });

    test('should handle invalid class ID', async () => {
      const studentData = {
        name: 'Test Student',
        classId: 'non-existent-class-id',
        initialBalance: 100.00
      };

      const response = await request(app)
        .post('/students')
        .set('Authorization', `Bearer ${validToken}`)
        .send(studentData);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', true);
    });
  });

  describe('PUT /students/:id', () => {
    beforeEach(async () => {
      await DatabaseTestUtils.insertTestRecord('students', testStudentData);
    });

    test('should update student with valid authentication', async () => {
      const updateData = {
        name: 'Updated Student Name',
        current_balance: 125.75
      };

      const response = await request(app)
        .put(`/students/${testStudentData.id}`)
        .set('Authorization', `Bearer ${validToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Student updated successfully');
      expect(response.body).toHaveProperty('student');
      expect(response.body.student.name).toBe(updateData.name);
      expect(response.body.student.current_balance).toBe(updateData.current_balance);
    });

    test('should fail without authentication', async () => {
      const updateData = { name: 'Updated Name' };

      const response = await request(app)
        .put(`/students/${testStudentData.id}`)
        .send(updateData);

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error', true);
    });

    test('should return 404 for non-existent student', async () => {
      const updateData = { name: 'Updated Name' };

      const response = await request(app)
        .put('/students/non-existent-id')
        .set('Authorization', `Bearer ${validToken}`)
        .send(updateData);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', true);
    });

    test('should ignore non-updatable fields', async () => {
      const updateData = {
        name: 'Updated Name',
        class_id: 'should-not-update',
        created_at: new Date()
      };

      const response = await request(app)
        .put(`/students/${testStudentData.id}`)
        .set('Authorization', `Bearer ${validToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.student.name).toBe(updateData.name);
      expect(response.body.student.class_id).toBe(testStudentData.class_id); // Should not change
    });
  });

  describe('DELETE /students/:id', () => {
    beforeEach(async () => {
      await DatabaseTestUtils.insertTestRecord('students', testStudentData);
    });

    test('should delete student with valid authentication', async () => {
      const response = await request(app)
        .delete(`/students/${testStudentData.id}`)
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Student deleted successfully');

      // Verify deletion
      const getResponse = await request(app)
        .get(`/students/${testStudentData.id}`);
      expect(getResponse.status).toBe(404);
    });

    test('should fail without authentication', async () => {
      const response = await request(app)
        .delete(`/students/${testStudentData.id}`);

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error', true);
    });

    test('should return 404 for non-existent student', async () => {
      const response = await request(app)
        .delete('/students/non-existent-id')
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', true);
    });
  });

  describe('PUT /students/:id/balance', () => {
    beforeEach(async () => {
      await DatabaseTestUtils.insertTestRecord('students', testStudentData);
    });

    test('should update student balance with valid authentication', async () => {
      const balanceData = { balance: 200.50 };

      const response = await request(app)
        .put(`/students/${testStudentData.id}/balance`)
        .set('Authorization', `Bearer ${validToken}`)
        .send(balanceData);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Balance updated successfully');
      expect(response.body.student.current_balance).toBe(200.50);
    });

    test('should fail with negative balance', async () => {
      const balanceData = { balance: -50.00 };

      const response = await request(app)
        .put(`/students/${testStudentData.id}/balance`)
        .set('Authorization', `Bearer ${validToken}`)
        .send(balanceData);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', true);
      expect(response.body).toHaveProperty('message', 'Balance cannot be negative');
    });

    test('should fail without balance field', async () => {
      const response = await request(app)
        .put(`/students/${testStudentData.id}/balance`)
        .set('Authorization', `Bearer ${validToken}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', true);
      expect(response.body).toHaveProperty('message', 'Balance is required');
    });
  });

  describe('PUT /students/:id/reset-balance', () => {
    beforeEach(async () => {
      // Create student with modified balance
      const modifiedStudentData = {
        ...testStudentData,
        initial_balance: 100.00,
        current_balance: 75.50 // Different from initial
      };
      await DatabaseTestUtils.insertTestRecord('students', modifiedStudentData);
    });

    test('should reset balance to initial balance', async () => {
      const response = await request(app)
        .put(`/students/${testStudentData.id}/reset-balance`)
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Balance reset successfully');
      expect(response.body.student.current_balance).toBe(100.00); // Should equal initial_balance
    });

    test('should fail without authentication', async () => {
      const response = await request(app)
        .put(`/students/${testStudentData.id}/reset-balance`);

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error', true);
    });
  });

  describe('Error Handling', () => {
    test('should handle malformed JSON', async () => {
      const response = await request(app)
        .post('/students')
        .set('Authorization', `Bearer ${validToken}`)
        .set('Content-Type', 'application/json')
        .send('{ invalid json }');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', true);
    });

    test('should handle very long student names', async () => {
      const longNameData = {
        name: 'A'.repeat(1000), // Very long name
        classId: testClassId,
        initialBalance: 100.00
      };

      const response = await request(app)
        .post('/students')
        .set('Authorization', `Bearer ${validToken}`)
        .send(longNameData);

      // Should either succeed (if database handles it) or fail gracefully
      if (response.status !== 201) {
        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error', true);
      }
    });

    test('should handle concurrent student creation', async () => {
      const student1Data = {
        name: 'Concurrent Student 1',
        classId: testClassId,
        initialBalance: 100.00
      };

      const student2Data = {
        name: 'Concurrent Student 2',
        classId: testClassId,
        initialBalance: 150.00
      };

      const [response1, response2] = await Promise.all([
        request(app)
          .post('/students')
          .set('Authorization', `Bearer ${validToken}`)
          .send(student1Data),
        request(app)
          .post('/students')
          .set('Authorization', `Bearer ${validToken}`)
          .send(student2Data)
      ]);

      // Both should succeed
      expect(response1.status).toBe(201);
      expect(response2.status).toBe(201);
      expect(response1.body.student.id).not.toBe(response2.body.student.id);
    });
  });

  describe('Input Validation', () => {
    test('should validate monetary field types', async () => {
      const invalidData = {
        name: 'Test Student',
        classId: testClassId,
        initialBalance: 'not-a-number'
      };

      const response = await request(app)
        .post('/students')
        .set('Authorization', `Bearer ${validToken}`)
        .send(invalidData);

      // Should either convert to 0 or fail with validation error
      expect([201, 400]).toContain(response.status);
      
      if (response.status === 201) {
        expect(response.body.student.initial_balance).toBe(0);
      }
    });

    test('should handle empty string values', async () => {
      const emptyData = {
        name: '',
        classId: testClassId,
        initialBalance: 100.00
      };

      const response = await request(app)
        .post('/students')
        .set('Authorization', `Bearer ${validToken}`)
        .send(emptyData);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', true);
    });

    test('should handle null values', async () => {
      const nullData = {
        name: null,
        classId: testClassId,
        initialBalance: 100.00
      };

      const response = await request(app)
        .post('/students')
        .set('Authorization', `Bearer ${validToken}`)
        .send(nullData);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', true);
    });
  });

  describe('Response Format', () => {
    test('should return consistent response format for success', async () => {
      await DatabaseTestUtils.insertTestRecord('students', testStudentData);

      const response = await request(app)
        .get(`/students/${testStudentData.id}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('student');
      expect(response.body.student).toHaveProperty('id');
      expect(response.body.student).toHaveProperty('name');
      expect(response.body.student).toHaveProperty('class_id');
      expect(response.body.student).toHaveProperty('initial_balance');
      expect(response.body.student).toHaveProperty('current_balance');
      expect(response.body.student).toHaveProperty('created_at');
    });

    test('should return consistent error format', async () => {
      const response = await request(app)
        .get('/students/non-existent-id');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', true);
      expect(response.body).toHaveProperty('message');
      expect(typeof response.body.message).toBe('string');
    });
  });
});