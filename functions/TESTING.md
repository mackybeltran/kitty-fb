# Testing Architecture

This project uses a unified testing approach where both unit tests and integration tests use the development database.

## Test Types

### Unit Tests (`.unit.test.ts` files)
- **Purpose**: Test individual functions and utilities in isolation
- **Environment**: Development database (`kitty-680c6`)
- **Database**: Real Firebase development database
- **Setup**: `unit-setup.ts`
- **Config**: `jest.unit.config.js`
- **Command**: `npm run test:unit`

### Integration Tests (`.test.ts` files - no `.unit.` prefix)
- **Purpose**: Test full API endpoints with real database operations
- **Environment**: Development database (`kitty-680c6`)
- **Database**: Real Firebase development database
- **Setup**: `setup.ts`
- **Config**: `jest.config.js` (default)
- **Command**: `npm run test`

## Running Tests

### Prerequisites
- Ensure you have access to the development database (`kitty-680c6`)
- No emulator setup required - all tests use the real dev database

### Commands

```bash
# Run unit tests (uses dev database)
npm run test:unit

# Run integration tests (uses dev database)
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
├── # Unit Tests (use dev database)
├── simpleUnit.unit.test.ts    # Basic app initialization tests
├── userValidation.unit.test.ts # Validation schema tests
├── validators.unit.test.ts    # Validator utility tests
├── 
└── # Integration Tests (use dev database)
├── userController.test.ts     # User controller API tests
└── userCreation.test.ts       # User creation API tests
```

## Recent Improvements

### Major Architecture Change
**Unified Database Approach**: Both unit and integration tests now use the development database, eliminating emulator dependencies and simplifying the testing setup.

### Benefits of Unified Approach
1. **No Emulator Dependencies**: No need to start/stop emulators
2. **Simpler Setup**: Just run tests directly
3. **Real Firebase Features**: Full Firestore functionality
4. **Better Performance**: No local emulator overhead
5. **Consistent Environment**: Same database for all tests
6. **More Reliable**: No network/port issues

### Fixed Issues
1. **Timeout Problems**: Eliminated emulator-related timeouts
2. **Emulator Dependencies**: Removed complex emulator setup
3. **Test Isolation**: Maintained through proper cleanup
4. **Performance**: Faster test execution without emulator overhead

### Optimizations
- **Efficient Cleanup**: Track test data IDs for faster cleanup
- **Simplified Configuration**: No emulator health checks needed
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