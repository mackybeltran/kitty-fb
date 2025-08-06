module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.unit.test.ts'], // Only matches unit tests
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/index.ts',
  ],
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup/unit-setup.ts'],
  testTimeout: 10000, // Reduced timeout since we're not using emulators
  transform: {
    '^.+\\.ts$': 'ts-jest'
  },
  // Simplified configuration for dev database
  maxWorkers: 1, // Run tests sequentially to avoid conflicts
  forceExit: true, // Force exit after tests complete
  detectOpenHandles: true, // Detect any open handles that prevent cleanup
  // Set environment variables for all unit tests
  setupFiles: ['<rootDir>/jest.unit.setup.js']
}; 