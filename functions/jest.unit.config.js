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
  testTimeout: 15000, // Increased timeout
  transform: {
    '^.+\\.ts$': 'ts-jest'
  }
}; 