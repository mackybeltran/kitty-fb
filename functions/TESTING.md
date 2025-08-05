# Testing Architecture

This project uses a dual testing approach with unit tests and integration tests.

## Test Types

### Unit Tests (`.unit.test.ts` files)
- **Purpose**: Test individual functions and utilities in isolation
- **Environment**: Firebase Emulators (localhost:8080, localhost:5001)
- **Database**: Local emulator database
- **Setup**: `unit-setup.ts`
- **Config**: `jest.unit.config.js`
- **Command**: `npm run test:unit`

### Integration Tests (`.test.ts` files - no `.unit.` prefix)
- **Purpose**: Test full API endpoints with real database operations
- **Environment**: Real Firebase development database
- **Database**: `kitty-680c6` (development project)
- **Setup**: `setup.ts`
- **Config**: `jest.config.js` (default)
- **Command**: `npm run test`

## Running Tests

### Prerequisites
1. **For Unit Tests**: Start Firebase emulators
   ```bash
   firebase emulators:start --only firestore
   ```

2. **For Integration Tests**: Ensure you have access to the development database

### Commands

```bash
# Check if emulators are running
npm run test:unit:check

# Run unit tests (requires emulators)
npm run test:unit

# Run integration tests (uses real database)
npm run test

# Run all tests with coverage
npm run test:coverage

# Watch mode for development
npm run test:watch
```

## Test Utilities

Both test setups provide these utilities:
- `createTestUser()` - Creates test user in database
- `createTestGroup()` - Creates test group in database
- `cleanupTestData()` - Cleans up test data
- `testEnv` - Firebase test environment
- `admin` - Firebase admin SDK instance

## File Structure

```
src/__tests__/
├── setup.ts                    # Integration test setup
├── unit-setup.ts              # Unit test setup
├── jest.d.ts                  # TypeScript definitions
├── 
├── # Unit Tests (use emulators)
├── simpleUnit.unit.test.ts    # Basic app initialization tests
├── userValidation.unit.test.ts # Validation schema tests
├── validators.unit.test.ts    # Validator utility tests
├── 
└── # Integration Tests (use real DB)
├── userController.test.ts     # User controller API tests
└── userCreation.test.ts       # User creation API tests
```

## Recent Improvements

### Fixed Issues
1. **Timeout Problems**: Optimized cleanup operations and increased timeouts
2. **Emulator Dependencies**: Added health checks for emulator availability
3. **Test Isolation**: Separated true unit tests from integration tests
4. **Performance**: Reduced test execution time from 291s to ~3s

### Optimizations
- **Efficient Cleanup**: Track test data IDs for faster cleanup
- **Emulator Health Checks**: Verify emulators are running before tests
- **Sequential Execution**: Run unit tests sequentially to avoid conflicts
- **Better Error Handling**: Graceful handling of cleanup failures

## Coverage Goals

- **Statements**: Aim for 70%+ overall coverage
- **Functions**: Aim for 80%+ coverage for critical business logic
- **Branches**: Improve conditional logic testing

## Current Coverage Status

### Well-Tested Areas
- `validators.ts`: 97.82% coverage ✅
- `joiValidation.ts`: 100% coverage ✅
- `app.ts`: 85.29% coverage ✅
- `balanceController.ts`: 100% coverage ✅ (NEW!)
- `firestore.ts`: 39.06% coverage (improved from 8.98%) ✅

### Areas Needing More Tests
- `firestore.ts`: 39.06% coverage (improved from 8.98%) - **GOOD PROGRESS**
- `databaseUtils.ts`: 34.32% coverage (improved from 4.47%) - **GOOD PROGRESS**
- Controllers: Most have <30% coverage - **balanceController now at 100%**

### Recent Coverage Improvements
- **Firestore Service**: 8.98% → 39.06% (+30.08% improvement)
- **Database Utils**: 4.47% → 34.32% (+29.85% improvement)
- **Balance Controller**: 33.33% → 100% (+66.67% improvement)
- **Overall Coverage**: 35.31% → 36.37% (+1.06% improvement)

### Test Count Growth
- **Before**: 40 tests total
- **After**: 70 tests total (+30 new tests)
- **New Test Files**: 3 new comprehensive unit test files 