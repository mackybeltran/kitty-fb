# Development Guide

Complete guide for local development, testing, and contributing to the Kitty FB project.

## Local Development Setup

### 1. Prerequisites

- Node.js 18+
- Firebase CLI
- Git
- Code editor (VS Code recommended)

### 2. Clone and Setup

```bash
# Clone the repository
git clone <repository-url>
cd kitty-fb

# Install dependencies
cd functions
npm install

# Copy environment file
cp env.example .env
```

### 3. Environment Configuration

Edit `.env` file:
```bash
# Development settings
NODE_ENV=development
ENABLE_DEV_UTILITIES=true

# Firebase project (use your project ID)
FIREBASE_PROJECT_ID=your-project-id
```

### 4. Start Local Development

```bash
# Start Firebase emulators
firebase emulators:start --only functions,firestore

# In another terminal, watch for changes
npm run watch
```

## Project Structure

```
functions/
├── src/
│   ├── app.ts                    # Express app setup
│   ├── index.ts                  # Firebase function entry
│   ├── controllers/              # Request handlers
│   │   ├── userController.ts
│   │   ├── groupController.ts
│   │   ├── bucketController.ts
│   │   ├── balanceController.ts
│   │   ├── transactionController.ts
│   │   └── devController.ts
│   ├── services/
│   │   └── firestore.ts          # Business logic
│   ├── middleware/
│   │   ├── errorHandler.ts       # Error handling
│   │   └── joiValidation.ts      # Validation middleware
│   ├── schemas/
│   │   └── validationSchemas.ts  # Joi schemas
│   └── utils/
│       ├── validators.ts         # Business validation
│       └── databaseUtils.ts      # Development utilities
├── package.json
└── tsconfig.json
```

## Development Workflow

### 1. Making Changes

1. **Create a feature branch:**
   ```bash
   git checkout -b feature/new-feature
   ```

2. **Make your changes** following the coding standards

3. **Test your changes:**
   ```bash
   npm run lint
   npm run build
   npm test
   ```

4. **Commit your changes:**
   ```bash
   git add .
   git commit -m "feat: add new feature"
   ```

5. **Push and create PR:**
   ```bash
   git push origin feature/new-feature
   ```

### 2. Testing Changes

#### Local Testing
```bash
# Start emulators
firebase emulators:start

# Test endpoints
curl -X GET http://localhost:5001/{project-id}/us-central1/api/dev/stats
```

#### Database Testing
```bash
# Wipe database
curl -X DELETE http://localhost:5001/{project-id}/us-central1/api/dev/wipe

# Seed test data
curl -X POST http://localhost:5001/{project-id}/us-central1/api/dev/seed

# Test specific endpoints
curl -X POST http://localhost:5001/{project-id}/us-central1/api/users/new \
  -H "Content-Type: application/json" \
  -d '{"displayName": "Test User", "email": "test@example.com"}'
```

### 3. Code Quality

#### Linting
```bash
# Check for linting errors
npm run lint

# Fix auto-fixable issues
npm run lint:fix
```

#### Type Checking
```bash
# Check TypeScript types
npm run build
```

#### Testing
```bash
# Run tests (when implemented)
npm test

# Run tests in watch mode
npm run test:watch
```

## Architecture Patterns

### Controller-Service Pattern

The application follows a layered architecture:

1. **Controllers** (`src/controllers/`) - Handle HTTP requests/responses
2. **Services** (`src/services/`) - Business logic and data operations
3. **Middleware** (`src/middleware/`) - Cross-cutting concerns
4. **Utils** (`src/utils/`) - Shared utilities and validation

### Example Flow

```
HTTP Request → Controller → Service → Firestore → Response
```

### Adding New Endpoints

1. **Create validation schema** in `src/schemas/validationSchemas.ts`
2. **Add validation middleware** in `src/middleware/joiValidation.ts`
3. **Implement business logic** in `src/services/firestore.ts`
4. **Create controller method** in appropriate controller
5. **Add route** in `src/app.ts`

## Database Development

### Firestore Collections

- `users` - User profiles
- `groups` - Group information
- `groups/{groupId}/members` - Group memberships
- `groups/{groupId}/buckets` - Bucket inventory
- `groups/{groupId}/consumption` - Consumption records
- `groups/{groupId}/transactions` - Kitty transactions
- `groups/{groupId}/join_requests` - Join requests

### Data Relationships

```
User ←→ Group (many-to-many)
  ↓
Bucket (belongs to User in Group)
  ↓
Consumption (records from Bucket)
```

### Development Utilities

#### Database Management
```bash
# Get database stats
curl -X GET /dev/stats

# Wipe all data
curl -X DELETE /dev/wipe

# Seed test data
curl -X POST /dev/seed

# Reset (wipe + seed)
curl -X POST /dev/reset
```

#### Testing Data
The seed function creates:
- 5 test users
- 3 test groups
- Random group memberships
- Initial buckets for each user

## API Testing

### Using Postman

1. **Import Collection:**
   - Create new collection in Postman
   - Import the example collection from [API.md](API.md)

2. **Set Environment Variables:**
   - `baseUrl`: `http://localhost:5001/{project-id}/us-central1/api`
   - `groupId`: Use group ID from seed data
   - `userId`: Use user ID from seed data

3. **Test Endpoints:**
   - Use the provided examples in the collection
   - Update variables as needed

### Using curl

```bash
# Test user creation
curl -X POST http://localhost:5001/{project-id}/us-central1/api/users/new \
  -H "Content-Type: application/json" \
  -d '{"displayName": "Test User", "email": "test@example.com"}'

# Test group creation
curl -X POST http://localhost:5001/{project-id}/us-central1/api/groups/new \
  -H "Content-Type: application/json" \
  -d '{"name": "Test Group"}'
```

## Debugging

### Function Logs

```bash
# View function logs
firebase functions:log

# View logs for specific function
firebase functions:log --only api
```

### Emulator Debugging

1. **Emulator UI**: `http://localhost:4000`
2. **Function Logs**: Check terminal output
3. **Firestore Data**: View in emulator UI

### Common Issues

#### 1. Port Conflicts
```bash
# Kill processes using ports
lsof -ti:5001 | xargs kill -9
lsof -ti:4000 | xargs kill -9
```

#### 2. Build Errors
```bash
# Clean and rebuild
rm -rf lib/
npm run build
```

#### 3. TypeScript Errors
```bash
# Check types
npx tsc --noEmit
```

## Deployment

### Development Deployment

```bash
# Deploy to development environment
firebase use development
firebase deploy --only functions
```

### Production Deployment

```bash
# Deploy to production
firebase use production
export NODE_ENV=production
firebase deploy --only functions
```

### Environment-Specific Config

Create `.firebaserc`:
```json
{
  "projects": {
    "default": "kitty-fb-dev",
    "development": "kitty-fb-dev",
    "production": "kitty-fb-prod"
  }
}
```

## Contributing Guidelines

### Code Standards

1. **TypeScript**: Use strict typing
2. **ESLint**: Follow linting rules
3. **JSDoc**: Document public functions
4. **Error Handling**: Use proper error middleware
5. **Validation**: Validate all inputs

### Commit Messages

Use conventional commits:
- `feat:` New features
- `fix:` Bug fixes
- `docs:` Documentation changes
- `style:` Code style changes
- `refactor:` Code refactoring
- `test:` Test changes
- `chore:` Maintenance tasks

### Pull Request Process

1. **Create feature branch**
2. **Make changes** following standards
3. **Test thoroughly**
4. **Update documentation**
5. **Create pull request**
6. **Request review**

## Performance Considerations

### Firestore Optimization

1. **Indexes**: Create composite indexes for complex queries
2. **Batch Operations**: Use batch writes for multiple operations
3. **Pagination**: Implement pagination for large datasets
4. **Caching**: Consider caching frequently accessed data

### Function Optimization

1. **Cold Starts**: Minimize dependencies
2. **Memory Usage**: Monitor function memory usage
3. **Timeout**: Set appropriate timeout values
4. **Concurrency**: Handle concurrent requests properly

## Security Best Practices

### Development

1. **Environment Variables**: Never commit secrets
2. **Firestore Rules**: Use restrictive rules in production
3. **Input Validation**: Validate all inputs
4. **Error Messages**: Don't expose sensitive information

### Production

1. **Authentication**: Implement proper auth
2. **Authorization**: Check user permissions
3. **Rate Limiting**: Implement rate limiting
4. **Monitoring**: Set up monitoring and alerts

## Monitoring and Logging

### Firebase Console

- **Functions**: Monitor function execution and errors
- **Firestore**: Monitor database usage and performance
- **Analytics**: Track API usage patterns

### Custom Logging

```typescript
// Add structured logging
console.log('User created', {
  userId: userRef.id,
  displayName: displayName,
  timestamp: new Date().toISOString()
});
```

## Next Steps

After setting up development environment:

1. **Explore the codebase** - Understand the architecture
2. **Run tests** - Ensure everything works
3. **Make small changes** - Get familiar with the workflow
4. **Contribute** - Pick up issues or create new features
5. **Document** - Update documentation as needed 