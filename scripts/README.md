# Database Seeding for Frontend Development

This directory contains scripts to help you set up test data for frontend development.

## Quick Start

1. **Ensure your dev database is accessible:**
   ```bash
   # Your backend should be deployed to your dev environment
   ```

2. **Seed the database with test data:**
   ```bash
   cd functions
   npm run seed
   ```

That's it! You now have test data to work with in your frontend.

## Available Commands

### Basic Seeding
```bash
npm run seed
```
Creates 8 users, 4 groups, and random memberships with buckets.

### Reset Database
```bash
npm run seed:reset
```
Wipes and reseeds the database in one operation.

### Large Dataset
```bash
npm run seed:large
```
Creates 15 users, 8 groups for more complex testing.

### Custom Configuration
```bash
node scripts/seed-database.js --users=10 --groups=5 --max-users=8
```

## What Gets Created

The seeding script creates:

- **Users**: Test users with realistic names and emails
- **Groups**: Test groups with different names
- **Memberships**: Users randomly assigned to groups
- **Buckets**: Each user gets 1-3 buckets with 5-14 units each
- **Admin Roles**: First user in each group becomes admin
- **Active Buckets**: First bucket for each user is set as active

## Test Data Examples

### Users
- Test User 1 (testuser1@example.com)
- Test User 2 (testuser2@example.com)
- etc.

### Groups
- Test Group 1
- Test Group 2
- Test Group 3
- etc.

### Sample API Calls

Once seeded, you can test these endpoints:

```bash
# Get all users
curl http://localhost:5001/kitty-680c6/us-central1/api/users

# Get a specific group
curl http://localhost:5001/kitty-680c6/us-central1/api/groups/{groupId}

# Get group members
curl http://localhost:5001/kitty-680c6/us-central1/api/groups/{groupId}/members
```

## Troubleshooting

### Dev Utilities Not Available
If you get an error about dev utilities not being available:

1. Make sure you're in development mode:
   ```bash
   export NODE_ENV=development
   ```

2. Or enable dev utilities explicitly:
   ```bash
   export ENABLE_DEV_UTILITIES=true
   ```

### API Not Accessible
If the API isn't responding:

1. Check that your dev database is accessible
2. Verify the API URL in the script matches your setup
3. Ensure your backend is deployed to the dev environment

### Permission Errors
If you get permission errors:

1. Make sure the script is executable:
   ```bash
   chmod +x scripts/seed-database.js
   ```

## Next Steps

After seeding:

1. Start building your frontend
2. Use the test data to develop your UI
3. Run the seeding script again anytime you need fresh data
4. Check the API documentation in `docs/API.md`

## Environment Variables

You can customize the API URL:

```bash
# Set your actual API URL
export API_BASE_URL=https://api-yqyq3bmp3a-uc.a.run.app

# Run the seeding script
npm run seed
```

**Important**: Don't commit the actual API URL to git. Use environment variables instead. 