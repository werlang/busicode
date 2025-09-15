import Mysql from '../../helpers/mysql.js';

/**
 * Database test utilities for setting up and tearing down test data
 */
export class DatabaseTestUtils {
  
  static async clearAllTables() {
    try {
      // Clear tables in correct order due to foreign key constraints
      await Mysql.query('SET FOREIGN_KEY_CHECKS = 0');
      
      const tables = [
        'sales',
        'company_members', 
        'company_revenues',
        'company_expenses',
        'products',
        'companies',
        'students',
        'classes',
        'admin_users'
      ];
      
      for (const table of tables) {
        await Mysql.query(`DELETE FROM ${table}`);
      }
      
      await Mysql.query('SET FOREIGN_KEY_CHECKS = 1');
      
    } catch (error) {
      console.warn('Error clearing tables:', error.message);
      // Don't throw - test database might not exist yet
    }
  }

  static async seedTestData() {
    try {
      // Create test admin user
      const adminId = 'test-admin-id';
      await Mysql.query(`
        INSERT IGNORE INTO admin_users (id, username, password_hash, is_active) 
        VALUES (?, 'test_admin', '$2b$10$/A1majQZsUVesr42SJOcseIVkLVEkRo3/GT8ocz6bjbb4W.ujWG6.', true)
      `, [adminId]);

      // Create test class
      const classId = 'test-class-id';
      await Mysql.query(`
        INSERT IGNORE INTO classes (id, name) 
        VALUES (?, 'Test Class')
      `, [classId]);

      // Create test students
      const student1Id = 'test-student-1';
      const student2Id = 'test-student-2';
      
      await Mysql.query(`
        INSERT IGNORE INTO students (id, name, class_id, initial_balance, current_balance) 
        VALUES (?, 'Test Student 1', ?, 100.00, 100.00)
      `, [student1Id, classId]);

      await Mysql.query(`
        INSERT IGNORE INTO students (id, name, class_id, initial_balance, current_balance) 
        VALUES (?, 'Test Student 2', ?, 150.00, 150.00)
      `, [student2Id, classId]);

      // Create test company
      const companyId = 'test-company-id';
      await Mysql.query(`
        INSERT IGNORE INTO companies (id, name, class_id, initial_budget, current_budget) 
        VALUES (?, 'Test Company', ?, 200.00, 200.00)
      `, [companyId, classId]);

      // Create test product
      const productId = 'test-product-id';
      await Mysql.query(`
        INSERT IGNORE INTO products (id, name, price, company_id, description) 
        VALUES (?, 'Test Product', 29.99, ?, 'A test product')
      `, [productId, companyId]);

      return {
        adminId,
        classId,
        student1Id,
        student2Id,
        companyId,
        productId
      };

    } catch (error) {
      console.error('Error seeding test data:', error);
      throw error;
    }
  }

  static async verifyDatabaseConnection() {
    try {
      const result = await Mysql.query('SELECT 1 as test');
      return result && result.length > 0;
    } catch (error) {
      console.error('Database connection failed:', error.message);
      return false;
    }
  }

  static async createTestDatabase() {
    try {
      // This would typically be handled by Docker compose in real testing
      console.log('Note: Database creation handled by Docker compose');
      return true;
    } catch (error) {
      console.error('Error creating test database:', error);
      return false;
    }
  }

  static async getTableCount(tableName) {
    try {
      const result = await Mysql.query(`SELECT COUNT(*) as count FROM ${tableName}`);
      return result[0]?.count || 0;
    } catch (error) {
      console.warn(`Error counting table ${tableName}:`, error.message);
      return 0;
    }
  }

  static async insertTestRecord(table, data) {
    try {
      return await Mysql.insert(table, data);
    } catch (error) {
      console.error(`Error inserting test record into ${table}:`, error);
      throw error;
    }
  }

  static async findTestRecord(table, filter) {
    try {
      return await Mysql.find(table, { filter, opt: { limit: 1 } });
    } catch (error) {
      console.error(`Error finding test record in ${table}:`, error);
      throw error;
    }
  }

  static async deleteTestRecord(table, id) {
    try {
      return await Mysql.delete(table, id);
    } catch (error) {
      console.error(`Error deleting test record from ${table}:`, error);
      throw error;
    }
  }
}

export default DatabaseTestUtils;