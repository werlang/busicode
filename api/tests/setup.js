import { beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals';
import Mysql from '../helpers/mysql.js';

// Mock console.warn to reduce noise in test output
const originalWarn = console.warn;
console.warn = (...args) => {
  if (!args[0]?.includes?.('Error clearing tables') && 
      !args[0]?.includes?.('Error counting table')) {
    originalWarn(...args);
  }
};

// Global test setup
beforeAll(async () => {
  // Set test environment
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test-secret';
  
  // Configure test database
  if (!process.env.MYSQL_DATABASE) {
    process.env.MYSQL_DATABASE = 'busicode_test';
  }
  if (!process.env.MYSQL_PASSWORD) {
    process.env.MYSQL_PASSWORD = 'asdf1234';
  }
  if (!process.env.MYSQL_HOST) {
    process.env.MYSQL_HOST = 'localhost';
  }
  
  console.log('Jest setup completed');
});

afterAll(async () => {
  // Close database connections
  try {
    await Mysql.close();
  } catch (error) {
    console.warn('Error closing database connection:', error.message);
  }
  
  // Restore console.warn
  console.warn = originalWarn;
});

// Add global test utilities
global.testUtils = {
  delay: (ms) => new Promise(resolve => setTimeout(resolve, ms)),
  randomString: (length = 8) => Math.random().toString(36).substring(2, length + 2),
  randomEmail: () => `test${Math.random().toString(36).substring(2)}@example.com`
};