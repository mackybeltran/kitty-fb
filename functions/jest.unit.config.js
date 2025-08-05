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
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/unit-setup.ts'], // Uses emulator setup
  testTimeout: 30000, // Increased timeout to 30 seconds for emulator operations
  transform: {
    '^.+\\.ts$': 'ts-jest'
  },
  // Add better handling for async operations
  maxWorkers: 1, // Run tests sequentially to avoid emulator conflicts
  forceExit: true, // Force exit after tests complete
  detectOpenHandles: true // Detect any open handles that prevent cleanup
}; 