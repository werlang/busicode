export default {
  testEnvironment: 'node',
  transform: {},
  extensionsToTreatAsEsm: ['.js'],
  globals: {
    'ts-jest': {
      useESM: true
    }
  },
  moduleNameMapping: {
    '^(\\.{1,2}/.*)\\.js$': '$1'
  },
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
  setupFilesAfterEnv: ['<rootDir>/api/tests/setup.js'],
  verbose: true,
  detectOpenHandles: true,
  forceExit: true
};