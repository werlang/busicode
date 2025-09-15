export default {
  testEnvironment: 'node',
  transform: {},
  testMatch: [
    '**/tests/**/*.test.js',
    '**/api/tests/**/*.test.js'
  ],
  collectCoverageFrom: [
    'api/**/*.js',
    '!api/tests/**',
    '!api/docs/**',
    '!**/node_modules/**'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  verbose: true,
  detectOpenHandles: true,
  forceExit: true
};