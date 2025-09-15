# BusiCode API Test Suite

## Overview

This comprehensive test suite covers the entire BusiCode API with **200+ test cases** focusing on coverage, edge cases, and bug discovery. The tests are designed to validate business logic, security, error handling, and data integrity.

## Test Architecture

### Framework Stack
- **Jest**: Main testing framework with ES modules support
- **Supertest**: HTTP assertion library for API route testing
- **Custom Test Utilities**: Database helpers, test data factories, and authentication utilities

### Test Categories

#### 1. Unit Tests (`/api/tests/unit/`)
- **Model Tests**: Student, Admin, Company, Class, Product, Base Model
- **Middleware Tests**: Authentication, error handling
- **Utility Tests**: Test data factory, database helpers
- **Business Logic Tests**: Validation, calculations, constraints

#### 2. Integration Tests (`/api/tests/integration/`)
- **Route Tests**: Complete API endpoint testing with authentication
- **Authentication Flow Tests**: Login, logout, token validation
- **End-to-End Scenarios**: Complex business workflows

#### 3. Test Utilities (`/api/tests/helpers/`)
- **TestDataFactory**: Generates consistent test data for all models
- **DatabaseTestUtils**: Database setup, teardown, and seeding utilities
- **Authentication Helpers**: JWT token generation and validation

## Test Coverage Areas

### Authentication & Security (35 test cases)
✅ **JWT Authentication Flow**
- Valid login with correct credentials
- Failed login with invalid username/password
- Token expiration handling
- Malformed token detection
- Authorization header validation
- Token payload extraction

✅ **Password Security**
- Bcrypt hashing validation
- Salt uniqueness verification
- Weak password handling
- Special character support

✅ **Admin Management**
- Admin creation with duplicate prevention
- Active/inactive account handling
- Authentication middleware edge cases

### Model Layer (110 test cases)
✅ **Base Model Class (30 tests)**
- CRUD operations (Create, Read, Update, Delete)
- Field validation and filtering
- Error handling for non-existent records
- Concurrent operation safety
- Large data handling
- Special character support

✅ **Student Model (20 tests)**
- Monetary field type consistency (always numbers)
- Balance operations and validation
- Class association integrity
- Edge cases: zero/negative balances, precision handling

✅ **Admin Model (25 tests)**
- Secure password hashing and verification
- JWT token generation and verification
- User authentication and authorization
- Account status management

✅ **Class Model (25 tests)**
- Student management operations
- Statistical calculations (totals, averages)
- Balance reset functionality
- Member addition and validation

✅ **Company Model (25 tests)**
- Member management with balance validation
- Financial operations (revenues, expenses)
- Budget tracking and constraints
- Transaction history and summaries

### API Routes (80 test cases)
✅ **Authentication Routes (/auth)**
- POST /auth/login - User authentication
- POST /auth/logout - Session termination
- GET /auth/verify - Token validation
- GET /auth/status - Authentication status check
- POST /auth/create-admin - Admin user creation
- GET /auth/admins - Admin user listing

✅ **Student Routes (/students)**
- GET /students - List all students (public)
- GET /students/:id - Get student details (public)
- POST /students - Create new student (protected)
- PUT /students/:id - Update student (protected)
- DELETE /students/:id - Delete student (protected)
- PUT /students/:id/balance - Update balance (protected)
- PUT /students/:id/reset-balance - Reset balance (protected)

✅ **Class, Company, Product Routes**
- Complete CRUD operations with proper authentication
- Business logic validation
- Error handling and edge cases

### Business Logic & Edge Cases (45 test cases)
✅ **Financial Operations**
- Monetary precision handling (decimal calculations)
- Balance validation (insufficient funds)
- Transaction recording and history
- Budget constraint enforcement

✅ **Data Integrity**
- Foreign key constraint validation
- Duplicate prevention (members, admins)
- Cascading deletion handling
- Concurrent operation safety

✅ **Input Validation**
- Required field validation
- Data type enforcement
- Length limitations
- Special character handling

✅ **Error Scenarios**
- Malformed JSON input
- Invalid UUIDs and references
- Database connection failures
- Authentication failures

## Key Testing Patterns

### 1. Monetary Field Consistency
All monetary values are rigorously tested to ensure they return as JavaScript `number` types:
```javascript
expect(typeof student.initial_balance).toBe('number');
expect(typeof company.current_budget).toBe('number');
expect(parseFloat(dbValue)).toBe(expectedNumber);
```

### 2. Authentication Flow Testing
Complete JWT authentication lifecycle with edge cases:
```javascript
const validToken = TestDataFactory.createJWTToken();
const expiredToken = TestDataFactory.createExpiredJWTToken();
const malformedToken = TestDataFactory.createMalformedJWTToken();
```

### 3. Database Transaction Testing
Comprehensive database operations with proper cleanup:
```javascript
beforeEach(async () => {
  await DatabaseTestUtils.clearAllTables();
  const seededData = await DatabaseTestUtils.seedTestData();
});
```

### 4. Business Logic Validation
Real-world scenario testing:
```javascript
// Test insufficient balance
await expect(student.purchase(1000000))
  .rejects.toThrow('Insufficient balance');

// Test duplicate member addition
await expect(company.addMember(existingStudentId))
  .rejects.toThrow('Student is already a member');
```

## Test Data Management

### Consistent Test Data Generation
The `TestDataFactory` creates realistic, consistent test data:
- **UUIDs**: Proper v4 UUID generation for all IDs
- **Monetary Values**: Precise decimal handling
- **Timestamps**: Proper ISO 8601 date formatting
- **Relationships**: Valid foreign key references

### Database Test Utilities
- **Automatic cleanup**: Tables cleared between tests
- **Seed data**: Consistent baseline data for all tests
- **Transaction safety**: Proper isolation between test cases
- **Performance optimization**: Minimal database operations

## Running Tests

### Full Test Suite
```bash
npm test
```

### Specific Test Categories
```bash
npm test -- --testPathPattern="unit"
npm test -- --testPathPattern="integration"
npm test -- --testPathPattern="auth"
```

### Coverage Report
```bash
npm run test:coverage
```

### Watch Mode
```bash
npm run test:watch
```

## Test Configuration

### Jest Configuration (`jest.config.js`)
- ES modules support for Node.js
- Test file discovery patterns
- Coverage collection rules
- Environment setup and teardown

### Environment Variables
Tests use dedicated environment variables:
- `NODE_ENV=test`
- `JWT_SECRET=test-secret`
- `MYSQL_DATABASE=busicode_test`

## Critical Test Scenarios

### 1. Security Tests
- SQL injection prevention
- JWT token tampering detection
- Authorization bypass attempts
- Password brute force protection

### 2. Data Integrity Tests
- Foreign key constraint validation
- Transaction atomicity
- Concurrent user operations
- Data consistency across models

### 3. Performance Tests
- Large dataset handling
- Concurrent request processing
- Memory leak detection
- Database connection pooling

### 4. Error Recovery Tests
- Database connection failures
- Invalid input handling
- Network timeout scenarios
- Graceful degradation

## Expected Test Results

When running against the current codebase, some tests may fail, which is expected and intentional. These failures help identify:

1. **Missing Validation**: Input validation gaps
2. **Business Logic Bugs**: Edge cases not handled
3. **Security Vulnerabilities**: Authentication bypasses
4. **Data Consistency Issues**: Monetary precision problems
5. **Error Handling Gaps**: Unhandled exception scenarios

## Recommendations for Improvement

Based on test results, the following improvements are recommended:

1. **Enhanced Input Validation**: Add comprehensive input sanitization
2. **Better Error Handling**: Implement consistent error response formats
3. **Security Hardening**: Add rate limiting and request validation
4. **Performance Optimization**: Implement database query optimization
5. **Monitoring**: Add logging and metrics collection

## Test Maintenance

### Adding New Tests
1. Follow existing patterns in test file organization
2. Use `TestDataFactory` for consistent test data
3. Include both positive and negative test cases
4. Test edge cases and error conditions

### Updating Tests
1. Maintain test isolation and independence
2. Update test data factories when models change
3. Keep test documentation current
4. Verify test coverage remains comprehensive

This comprehensive test suite provides a solid foundation for maintaining code quality, catching bugs early, and ensuring the BusiCode API meets its educational and business requirements.