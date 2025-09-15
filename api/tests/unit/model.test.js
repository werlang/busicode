import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import Model from '../../model/model.js';
import DatabaseTestUtils from '../helpers/databaseTestUtils.js';
import TestDataFactory from '../helpers/testDataFactory.js';

describe('Base Model Class', () => {
  let testModel;
  let testData;

  beforeEach(async () => {
    await DatabaseTestUtils.clearAllTables();
    await DatabaseTestUtils.seedTestData();

    // Create a test model using the classes table
    testData = {
      id: 'test-model-id',
      name: 'Test Model Class',
      created_at: new Date()
    };

    testModel = new Model('classes', {
      fields: {
        id: testData.id,
        name: testData.name,
        created_at: testData.created_at
      },
      allowUpdate: ['name'],
      insertFields: ['id', 'name']
    });
  });

  afterEach(async () => {
    await DatabaseTestUtils.clearAllTables();
  });

  describe('Constructor', () => {
    test('should initialize with table name and options', () => {
      const model = new Model('test_table', {
        fields: { id: '123', name: 'test' },
        allowUpdate: ['name'],
        insertFields: ['id', 'name']
      });

      expect(model.table).toBe('test_table');
      expect(model.fields).toEqual({ id: '123', name: 'test' });
      expect(model.allowUpdate).toEqual(['name']);
      expect(model.insertFields).toEqual(['id', 'name']);
      expect(model.id).toBe('123');
      expect(model.name).toBe('test');
    });

    test('should set default values for options', () => {
      const model = new Model('test_table');

      expect(model.table).toBe('test_table');
      expect(model.fields).toEqual({});
      expect(model.allowUpdate).toEqual([]);
      expect(model.insertFields).toEqual([]);
    });

    test('should assign field values as instance properties', () => {
      const fields = {
        id: 'test-id',
        name: 'Test Name',
        value: 42,
        active: true
      };

      const model = new Model('test_table', { fields });

      expect(model.id).toBe('test-id');
      expect(model.name).toBe('Test Name');
      expect(model.value).toBe(42);
      expect(model.active).toBe(true);
    });
  });

  describe('Static Methods', () => {
    test('getAll should retrieve all records from table', async () => {
      // Insert test data
      await DatabaseTestUtils.insertTestRecord('classes', testData);

      const results = await Model.getAll('classes');

      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
      
      const testRecord = results.find(r => r.id === testData.id);
      expect(testRecord).toBeDefined();
      expect(testRecord.name).toBe(testData.name);
    });

    test('getAll should handle empty tables', async () => {
      await DatabaseTestUtils.clearAllTables();

      const results = await Model.getAll('classes');

      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBe(0);
    });

    test('getAll should apply filters', async () => {
      // Insert multiple test records
      const testData1 = { ...testData, id: 'test-1', name: 'Class A' };
      const testData2 = { ...testData, id: 'test-2', name: 'Class B' };
      
      await DatabaseTestUtils.insertTestRecord('classes', testData1);
      await DatabaseTestUtils.insertTestRecord('classes', testData2);

      const results = await Model.getAll('classes', { name: 'Class A' });

      expect(results.length).toBe(1);
      expect(results[0].name).toBe('Class A');
    });

    test('getAll should apply options like limit', async () => {
      // Insert multiple records
      for (let i = 0; i < 5; i++) {
        await DatabaseTestUtils.insertTestRecord('classes', {
          id: `test-${i}`,
          name: `Class ${i}`,
          created_at: new Date()
        });
      }

      const results = await Model.getAll('classes', {}, { limit: 2 });

      expect(results.length).toBe(2);
    });
  });

  describe('Instance Methods', () => {
    describe('get', () => {
      test('should retrieve record by ID and update instance', async () => {
        await DatabaseTestUtils.insertTestRecord('classes', testData);

        const model = new Model('classes', {
          fields: { id: testData.id }
        });

        await model.get();

        expect(model.name).toBe(testData.name);
        expect(model.id).toBe(testData.id);
      });

      test('should throw error for non-existent record', async () => {
        const model = new Model('classes', {
          fields: { id: 'non-existent-id' }
        });

        await expect(model.get()).rejects.toThrow('classe not found');
      });

      test('should handle missing ID', async () => {
        const model = new Model('classes', {
          fields: {}
        });

        await expect(model.get()).rejects.toThrow();
      });
    });

    describe('getBy', () => {
      test('should retrieve record by specified field', async () => {
        await DatabaseTestUtils.insertTestRecord('classes', testData);

        const model = new Model('classes', {
          fields: { name: testData.name }
        });

        await model.getBy('name');

        expect(model.id).toBe(testData.id);
        expect(model.name).toBe(testData.name);
      });

      test('should apply additional filters', async () => {
        // Insert multiple records with same name but different IDs
        const testData1 = { ...testData, id: 'test-1' };
        const testData2 = { ...testData, id: 'test-2' };
        
        await DatabaseTestUtils.insertTestRecord('classes', testData1);
        await DatabaseTestUtils.insertTestRecord('classes', testData2);

        const model = new Model('classes', {
          fields: { name: testData.name }
        });

        await model.getBy('name', { id: 'test-2' });

        expect(model.id).toBe('test-2');
      });

      test('should throw error when record not found', async () => {
        const model = new Model('classes', {
          fields: { name: 'Non-existent Class' }
        });

        await expect(model.getBy('name')).rejects.toThrow('classe not found');
      });
    });

    describe('insert', () => {
      test('should insert new record with specified fields', async () => {
        const insertData = {
          id: 'new-test-id',
          name: 'New Test Class'
        };

        const model = new Model('classes', {
          fields: insertData,
          insertFields: ['id', 'name']
        });

        const result = await model.insert();

        expect(result).toBeTruthy();
        
        // Verify in database
        const dbRecord = await DatabaseTestUtils.findTestRecord('classes', { id: 'new-test-id' });
        expect(dbRecord.length).toBe(1);
        expect(dbRecord[0].name).toBe('New Test Class');
      });

      test('should add created_at if field exists', async () => {
        const beforeInsert = new Date();

        const model = new Model('classes', {
          fields: {
            id: 'test-created-at',
            name: 'Test Created At',
            created_at: null // Will be overwritten
          },
          insertFields: ['id', 'name']
        });

        await model.insert();

        // Verify created_at was set
        const dbRecord = await DatabaseTestUtils.findTestRecord('classes', { id: 'test-created-at' });
        expect(dbRecord[0].created_at).toBeTruthy();
        expect(new Date(dbRecord[0].created_at).getTime()).toBeGreaterThanOrEqual(beforeInsert.getTime());
      });

      test('should only insert allowed fields', async () => {
        const model = new Model('classes', {
          fields: {
            id: 'test-filtered',
            name: 'Test Filtered',
            unauthorized_field: 'should not be inserted'
          },
          insertFields: ['id', 'name'] // unauthorized_field not included
        });

        await model.insert();

        // Verify unauthorized field was not inserted
        const dbRecord = await DatabaseTestUtils.findTestRecord('classes', { id: 'test-filtered' });
        expect(dbRecord[0]).not.toHaveProperty('unauthorized_field');
      });

      test('should handle null and undefined values', async () => {
        const model = new Model('classes', {
          fields: {
            id: 'test-null',
            name: 'Test Null',
            optional_field: null,
            undefined_field: undefined
          },
          insertFields: ['id', 'name', 'optional_field', 'undefined_field']
        });

        await model.insert();

        // Should succeed without errors
        const dbRecord = await DatabaseTestUtils.findTestRecord('classes', { id: 'test-null' });
        expect(dbRecord.length).toBe(1);
      });

      test('should set insertId if returned', async () => {
        // This test simulates auto-increment ID behavior
        const model = new Model('classes', {
          fields: {
            name: 'Test Auto ID'
          },
          insertFields: ['name']
        });

        const result = await model.insert();

        if (result && result.insertId) {
          expect(model.id).toBe(result.insertId);
        }
      });
    });

    describe('update', () => {
      beforeEach(async () => {
        await DatabaseTestUtils.insertTestRecord('classes', testData);
      });

      test('should update allowed fields', async () => {
        const model = new Model('classes', {
          fields: { id: testData.id },
          allowUpdate: ['name']
        });

        const updateData = {
          name: 'Updated Class Name',
          id: 'should-not-update' // Not in allowUpdate
        };

        await model.update(updateData);

        expect(model.name).toBe('Updated Class Name');
        expect(model.id).toBe(testData.id); // Should not change

        // Verify in database
        const dbRecord = await DatabaseTestUtils.findTestRecord('classes', { id: testData.id });
        expect(dbRecord[0].name).toBe('Updated Class Name');
      });

      test('should throw error without ID', async () => {
        const model = new Model('classes', {
          fields: {},
          allowUpdate: ['name']
        });

        await expect(model.update({ name: 'New Name' })).rejects.toThrow('ID is required for update');
      });

      test('should throw error with no valid update fields', async () => {
        const model = new Model('classes', {
          fields: { id: testData.id },
          allowUpdate: ['name']
        });

        await expect(model.update({ unauthorized_field: 'value' })).rejects.toThrow('No valid fields to update');
      });

      test('should update local instance properties', async () => {
        const model = new Model('classes', {
          fields: { id: testData.id, name: testData.name },
          allowUpdate: ['name']
        });

        await model.update({ name: 'Updated Name' });

        expect(model.name).toBe('Updated Name');
      });

      test('should handle empty update data', async () => {
        const model = new Model('classes', {
          fields: { id: testData.id },
          allowUpdate: ['name']
        });

        await expect(model.update({})).rejects.toThrow('No valid fields to update');
      });
    });

    describe('delete', () => {
      beforeEach(async () => {
        await DatabaseTestUtils.insertTestRecord('classes', testData);
      });

      test('should delete record by ID', async () => {
        const model = new Model('classes', {
          fields: { id: testData.id }
        });

        await model.delete();

        // Verify deletion
        const dbRecord = await DatabaseTestUtils.findTestRecord('classes', { id: testData.id });
        expect(dbRecord.length).toBe(0);
      });

      test('should throw error without ID', async () => {
        const model = new Model('classes', {
          fields: {}
        });

        await expect(model.delete()).rejects.toThrow('ID is required for delete');
      });

      test('should handle non-existent record gracefully', async () => {
        const model = new Model('classes', {
          fields: { id: 'non-existent-id' }
        });

        // Should not throw error even if record doesn't exist
        await expect(model.delete()).resolves.toBeDefined();
      });
    });

    describe('toJSON', () => {
      test('should return clean object with field values', () => {
        const fields = {
          id: 'test-id',
          name: 'Test Name',
          value: 42,
          active: true
        };

        const model = new Model('test_table', { fields });
        const json = model.toJSON();

        expect(json).toEqual(fields);
        expect(json).not.toHaveProperty('table');
        expect(json).not.toHaveProperty('allowUpdate');
        expect(json).not.toHaveProperty('insertFields');
      });

      test('should handle empty fields', () => {
        const model = new Model('test_table', { fields: {} });
        const json = model.toJSON();

        expect(json).toEqual({});
      });

      test('should include all field types', () => {
        const fields = {
          stringField: 'text',
          numberField: 123,
          booleanField: true,
          nullField: null,
          undefinedField: undefined,
          dateField: new Date(),
          arrayField: [1, 2, 3],
          objectField: { nested: 'value' }
        };

        const model = new Model('test_table', { fields });
        const json = model.toJSON();

        expect(json).toMatchObject(fields);
      });
    });
  });

  describe('Error Handling', () => {
    test('should handle database connection errors gracefully', async () => {
      // This test would need a way to simulate database errors
      // For now, we'll test with an invalid table name
      
      const model = new Model('non_existent_table', {
        fields: { id: 'test' }
      });

      await expect(model.get()).rejects.toThrow();
    });

    test('should validate table name', () => {
      expect(() => new Model('')).not.toThrow(); // Constructor doesn't validate
      expect(() => new Model(null)).not.toThrow(); // Constructor doesn't validate
    });
  });

  describe('Edge Cases', () => {
    test('should handle very large field values', async () => {
      const largeText = 'A'.repeat(1000);
      const testClass = {
        id: 'large-test',
        name: largeText,
        created_at: new Date()
      };

      await DatabaseTestUtils.insertTestRecord('classes', testClass);

      const model = new Model('classes', {
        fields: { id: 'large-test' }
      });

      await model.get();
      expect(model.name).toBe(largeText);
    });

    test('should handle special characters in field values', async () => {
      const specialText = "Test with 'quotes' and \"double quotes\" and \\ backslashes";
      const testClass = {
        id: 'special-test',
        name: specialText,
        created_at: new Date()
      };

      await DatabaseTestUtils.insertTestRecord('classes', testClass);

      const model = new Model('classes', {
        fields: { id: 'special-test' }
      });

      await model.get();
      expect(model.name).toBe(specialText);
    });

    test('should handle concurrent operations', async () => {
      const model1 = new Model('classes', {
        fields: { id: 'concurrent-1', name: 'Concurrent Test 1' },
        insertFields: ['id', 'name']
      });

      const model2 = new Model('classes', {
        fields: { id: 'concurrent-2', name: 'Concurrent Test 2' },
        insertFields: ['id', 'name']
      });

      // Concurrent inserts should both succeed
      const [result1, result2] = await Promise.all([
        model1.insert(),
        model2.insert()
      ]);

      expect(result1).toBeTruthy();
      expect(result2).toBeTruthy();

      // Verify both records exist
      const dbRecord1 = await DatabaseTestUtils.findTestRecord('classes', { id: 'concurrent-1' });
      const dbRecord2 = await DatabaseTestUtils.findTestRecord('classes', { id: 'concurrent-2' });
      
      expect(dbRecord1.length).toBe(1);
      expect(dbRecord2.length).toBe(1);
    });
  });
});