# Kitty FB

A Firebase Cloud Functions API for managing shared inventory in group spaces. Users can purchase buckets of units (any consumable items), track consumption through an honor system, and manage group finances.

## Features

- Create users with display name and email
- Create groups with kitty balance tracking
- Add users to groups with admin permissions
- Purchase buckets of customizable sizes
- Track consumption with honor system
- Manage user debt balances (admin-controlled)
- Automatic bucket switching when active bucket is empty
- RESTful API endpoints
- Firebase Firestore integration

## Firebase Console Setup

1. **Create Firebase Project:**
   - Go to [Firebase Console](https://console.firebase.google.com)
   - Click "Add project"
   - Enter project name and follow setup wizard

2. **Upgrade to Blaze Plan (Required for Cloud Functions):**
   - In Firebase Console, go to "Usage and billing"
   - Click "Upgrade" to Blaze (pay-as-you-go) plan
   - Add payment method (required, but generous free tier)

3. **Set Up Billing Protection (Recommended):**
   - Go to [Google Cloud Console](https://console.cloud.google.com/billing)
   - Create budget with $1.00 cap
   - Set up "Disable billing" action at 100% threshold
   - Add email alerts at 50% and 90%

4. **Initialize Firebase in Project:**
   ```bash
   firebase login
   firebase init
   # Select: Functions, Firestore
   # Choose your project
   ```

## Setup

1. **Install dependencies:**
   ```bash
   cd functions
   npm install
   ```

2. **Build functions:**
   ```bash
   npm run build
   ```

3. **Deploy to Firebase:**
   ```bash
   firebase deploy --only functions
   ```

## Business Rules

### Bucket System
- Buckets can be any size (5, 8, 10 units, etc.)
- All buckets in one purchase must be the same size
- Users have one active bucket at a time
- When active bucket is empty, automatically switches to next available
- Users cannot consume if they have no active bucket

### Balance System
- User balances can only be negative (representing debt)
- Only group admins can update balances
- Balance is independent of bucket purchases
- Tracks money owed for buckets purchased on credit

### Consumption System
- Honor system: all users can mark consumption
- Tracks individual units consumed
- Reduces units in active bucket
- Maintains consumption audit trail

### Admin System
- First user added to a group automatically becomes admin
- Only one admin per group
- Every group must have an admin
- Users can be admin of one group, member of others

## API Endpoints

### Create User
- **URL:** `{your-function-url}/users/new`
- **Method:** POST
- **Body:**
  ```json
  {
    "displayName": "John Doe",
    "email": "john@example.com"
  }
  ```
- **Response:** `201` status with `{"userId": "..."}`

### Create Group
- **URL:** `{your-function-url}/groups/new`
- **Method:** POST
- **Body:**
  ```json
  {
    "name": "My Group"
  }
  ```
- **Response:** `201` status with `{"groupId": "..."}`

### Add User to Group
- **URL:** `{your-function-url}/groups/{groupId}/members`
- **Method:** POST
- **Body:**
  ```json
  {
    "userId": "user123"
  }
  ```
- **Parameters:**
  - `groupId` (path parameter): The ID of the group to add the user to
  - `is_admin` (optional): Whether the user should be a group admin (only used for non-first users)
- **Response:** `200` status with `{"message": "User added to group successfully"}`
- **Error Responses:**
  - `400`: Missing userId or invalid is_admin value
  - `404`: User or group not found
  - `409`: User is already a member of the group
  - `409`: Group already has an admin (when trying to add second admin)

### Purchase Buckets
- **URL:** `{your-function-url}/groups/{groupId}/buckets`
- **Method:** POST
- **Body:**
  ```json
  {
    "userId": "user123",
    "bucketCount": 5,
    "unitsPerBucket": 8
  }
  ```
- **Parameters:**
  - `groupId` (path parameter): The ID of the group
  - `userId` (body): The ID of the user purchasing buckets
  - `bucketCount` (body): Number of buckets to purchase
  - `unitsPerBucket` (body): Units in each bucket
- **Response:** `200` status with `{"bucketIds": ["...", "..."]}`
- **Error Responses:**
  - `400`: Missing fields or invalid values
  - `404`: User or group not found, user not a member of the group
- **What Gets Created:**
  - Multiple bucket documents with specified units
  - First bucket becomes active bucket (if user has none)
  - All buckets start with "active" status

### Record Consumption
- **URL:** `{your-function-url}/groups/{groupId}/consumption`
- **Method:** POST
- **Body:**
  ```json
  {
    "userId": "user123",
    "units": 2
  }
  ```
- **Parameters:**
  - `groupId` (path parameter): The ID of the group
  - `userId` (body): The ID of the user consuming units
  - `units` (body): Number of units to consume
- **Response:** `200` status with `{"message": "Consumption recorded successfully"}`
- **Error Responses:**
  - `400`: Missing fields or invalid values
  - `404`: User or group not found, user not a member of the group
  - `400`: User has no active bucket
  - `400`: Insufficient units in active bucket
- **What Gets Updated:**
  - Reduces units in active bucket
  - Creates consumption record with timestamp
  - If bucket becomes empty, marks as "completed" and switches to next bucket
  - If no more buckets, sets activeBucketId to null

### Update User Balance
- **URL:** `{your-function-url}/groups/{groupId}/members/{userId}/balance`
- **Method:** PATCH
- **Body:**
  ```json
  {
    "amount": -20,
    "adminUserId": "admin123"
  }
  ```
- **Parameters:**
  - `groupId` (path parameter): The ID of the group
  - `userId` (path parameter): The ID of the user whose balance to update
  - `amount` (body): Amount to add to balance (negative for debt, positive for payment)
  - `adminUserId` (body): The ID of the admin making the change
- **Response:** `200` status with `{"message": "User balance updated successfully"}`
- **Error Responses:**
  - `400`: Missing fields or invalid values
  - `404`: User or group not found, user not a member of the group
  - `400`: Only group admins can update user balances
  - `400`: Amount cannot be zero
  - `400`: User balance cannot be positive
- **What Gets Updated:**
  - User's balance in both directions of the relationship
  - Balance can only be negative (debt)

### Get Group Details
- **URL:** `{your-function-url}/groups/{groupId}`
- **Method:** GET
- **Response:** Group details including kitty balance, member count, member list, and bucket inventory

### Get Group Members
- **URL:** `{your-function-url}/groups/{groupId}/members`
- **Method:** GET
- **Response:** Array of group members with their balances and active bucket IDs

### Get User Details
- **URL:** `{your-function-url}/users/{userId}`
- **Method:** GET
- **Response:** User details including groups, balances, and active bucket IDs

### Get User Buckets
- **URL:** `{your-function-url}/groups/{groupId}/members/{userId}/buckets`
- **Method:** GET
- **Response:** Array of user's buckets with remaining units and status

### Get Group Consumption History
- **URL:** `{your-function-url}/groups/{groupId}/consumption`
- **Method:** GET
- **Response:** Array of consumption records with timestamps and bucket IDs

## Development Utilities

⚠️ **WARNING: These utilities are for development/testing only and will modify database data.**

The development utilities are only available when:
- `NODE_ENV=development` is set, OR
- `ENABLE_DEV_UTILITIES=true` is set

### Environment Configuration

Copy `functions/env.example` to `functions/.env` and configure:

```bash
# Enable development utilities
ENABLE_DEV_UTILITIES=true
NODE_ENV=development
```

### Development Endpoints

#### Check Dev Utilities Status
- **URL:** `{your-function-url}/dev/status`
- **Method:** GET
- **Response:** Shows if dev utilities are available

#### Get Database Statistics
- **URL:** `{your-function-url}/dev/stats`
- **Method:** GET
- **Response:** Database statistics (user count, group count, bucket count, consumption count, etc.)

#### Wipe Database
- **URL:** `{your-function-url}/dev/wipe`
- **Method:** DELETE
- **Response:** Confirmation of wiped collections

#### Seed Database
- **URL:** `{your-function-url}/dev/seed`
- **Method:** POST
- **Body:** `{"userCount": 5, "groupCount": 3, "maxUsersPerGroup": 4}`
- **Response:** Created test data with users, groups, and initial buckets

#### Reset Database
- **URL:** `{your-function-url}/dev/reset`
- **Method:** POST
- **Body:** `{"collections": ["users", "groups"], "seedOptions": {...}}`
- **Response:** Reset confirmation and created test data

### Production Safety

In production environments:
1. Set `NODE_ENV=production` (default)
2. Do NOT set `ENABLE_DEV_UTILITIES=true`
3. The `/dev/*` endpoints will return errors if accessed

## Local Development

Start Firebase emulators:
```bash
firebase emulators:start --only functions,firestore
```

Local endpoints will be available at:
- `http://localhost:5001/{project-id}/us-central1/api/users/new`
- `http://localhost:5001/{project-id}/us-central1/api/groups/new`
- `http://localhost:5001/{project-id}/us-central1/api/groups/{groupId}/members`
- `http://localhost:5001/{project-id}/us-central1/api/groups/{groupId}/buckets`
- `http://localhost:5001/{project-id}/us-central1/api/groups/{groupId}/consumption`

### Testing API Endpoints with Postman

**Create a user:**
1. Create new request in Postman
2. Set method to **POST**
3. URL: `http://localhost:5001/{project-id}/us-central1/api/users/new`
4. Go to **Headers** tab:
   - Key: `Content-Type`
   - Value: `application/json`
5. Go to **Body** tab:
   - Select **raw**
   - Choose **JSON** from dropdown
   - Enter:
   ```json
   {
     "displayName": "John Doe",
     "email": "john@example.com"
   }
   ```
6. Click **Send**

**Create a group:**
1. Create new request in Postman
2. Set method to **POST**
3. URL: `http://localhost:5001/{project-id}/us-central1/api/groups/new`
4. Go to **Headers** tab:
   - Key: `Content-Type`
   - Value: `application/json`
5. Go to **Body** tab:
   - Select **raw**
   - Choose **JSON** from dropdown
   - Enter:
   ```json
   {
     "name": "My Group"
   }
   ```
6. Click **Send**

**Add user to group:**
1. Create new request in Postman
2. Set method to **POST**
3. URL: `http://localhost:5001/{project-id}/us-central1/api/groups/{groupId}/members`
   - Replace `{groupId}` with actual group ID
4. Go to **Headers** tab:
   - Key: `Content-Type`
   - Value: `application/json`
5. Go to **Body** tab:
   - Select **raw**
   - Choose **JSON** from dropdown
   - Enter:
   ```json
   {
     "userId": "user123"
   }
   ```
   - Replace `user123` with actual user ID
6. Click **Send**

**Purchase buckets:**
1. Create new request in Postman
2. Set method to **POST**
3. URL: `http://localhost:5001/{project-id}/us-central1/api/groups/{groupId}/buckets`
   - Replace `{groupId}` with actual group ID
4. Go to **Headers** tab:
   - Key: `Content-Type`
   - Value: `application/json`
5. Go to **Body** tab:
   - Select **raw**
   - Choose **JSON** from dropdown
   - Enter:
   ```json
   {
     "userId": "user123",
     "bucketCount": 3,
     "unitsPerBucket": 8
   }
   ```
   - Replace `user123` with actual user ID
6. Click **Send**

**Record consumption:**
1. Create new request in Postman
2. Set method to **POST**
3. URL: `http://localhost:5001/{project-id}/us-central1/api/groups/{groupId}/consumption`
   - Replace `{groupId}` with actual group ID
4. Go to **Headers** tab:
   - Key: `Content-Type`
   - Value: `application/json`
5. Go to **Body** tab:
   - Select **raw**
   - Choose **JSON** from dropdown
   - Enter:
   ```json
   {
     "userId": "user123",
     "units": 2
   }
   ```
   - Replace `user123` with actual user ID
6. Click **Send**

**Update user balance:**
1. Create new request in Postman
2. Set method to **PATCH**
3. URL: `http://localhost:5001/{project-id}/us-central1/api/groups/{groupId}/members/{userId}/balance`
   - Replace `{groupId}` and `{userId}` with actual IDs
4. Go to **Headers** tab:
   - Key: `Content-Type`
   - Value: `application/json`
5. Go to **Body** tab:
   - Select **raw**
   - Choose **JSON** from dropdown
   - Enter:
   ```json
   {
     "amount": -20,
     "adminUserId": "admin123"
   }
   ```
   - Replace `admin123` with actual admin user ID
   - Use negative amount for debt, positive for payment
6. Click **Send**

**Expected responses:**
- Success: `201` status with `{"userId": "..."}` or `{"groupId": "..."}`
- Success (add to group): `200` status with `{"message": "User added to group successfully"}`
- Success (purchase buckets): `200` status with `{"bucketIds": ["...", "..."]}`
- Success (consumption): `200` status with `{"message": "Consumption recorded successfully"}`
- Success (balance update): `200` status with `{"message": "User balance updated successfully"}`
- Error: `400` for missing fields, `404` for not found, `409` for conflicts, `500` for server errors

## Group Admin Permissions

The API supports group-level admin permissions through the `is_admin` flag:

### How it works:
- **First user rule**: The first user added to a group automatically becomes the admin
- **Only one admin per group**: Each group can have exactly one admin
- **Every group must have an admin**: Groups cannot exist without an admin
- The `is_admin` flag is stored in both directions of the relationship:
  - In the user's groups subcollection (`users/{userId}/groups/{groupId}`)
  - In the group's members subcollection (`groups/{groupId}/members/{userId}`)
- Group admins can have special permissions within that specific group
- A user can be an admin of one group but a regular member of another group

### Usage:
```json
// First user (automatically becomes admin)
{
  "userId": "user123"
}

// Subsequent users (optional is_admin parameter)
{
  "userId": "user456",
  "is_admin": false  // Only false is allowed for non-first users
}
```

### Database Structure:
```
users/{userId}/groups/{groupId}:
{
  "groupId": "group123",
  "balance": -20,
  "is_admin": true,
  "activeBucketId": "bucket123",
  "joinedAt": "2025-01-27T..."
}

groups/{groupId}/members/{userId}:
{
  "userId": "user123",
  "balance": -20,
  "is_admin": true,
  "activeBucketId": "bucket123",
  "joinedAt": "2025-01-27T..."
}
```

## Data Model

### Users Collection
```json
{
  "displayName": "John Doe",
  "email": "john@example.com",
  "createdAt": "2025-01-27T..."
}
```

### Groups Collection
```json
{
  "name": "Weekend Trip",
  "kittyBalance": 150,
  "createdAt": "2025-01-27T..."
}
```

### Buckets Collection
```json
{
  "userId": "user123",
  "unitsInBucket": 8,
  "remainingUnits": 6,
  "status": "active",
  "purchasedAt": "2025-01-27T...",
  "purchaseBatchId": "batch_1234567890_user123"
}
```

### Consumption Collection
```json
{
  "userId": "user123",
  "units": 2,
  "bucketId": "bucket123",
  "consumedAt": "2025-01-27T..."
}
```

## Project Structure

```
kitty-fb/
├── functions/
│   ├── src/
│   │   ├── app.ts                    # Express app setup
│   │   ├── index.ts                  # Firebase function entry
│   │   ├── controllers/              # Request handlers
│   │   │   ├── userController.ts
│   │   │   ├── groupController.ts
│   │   │   ├── bucketController.ts
│   │   │   ├── balanceController.ts
│   │   │   └── devController.ts
│   │   ├── services/
│   │   │   └── firestore.ts          # Business logic
│   │   ├── middleware/
│   │   │   ├── errorHandler.ts       # Error handling
│   │   │   └── joiValidation.ts      # Validation middleware
│   │   ├── schemas/
│   │   │   └── validationSchemas.ts  # Joi schemas
│   │   └── utils/
│   │       ├── validators.ts         # Business validation
│   │       └── databaseUtils.ts      # Development utilities
│   └── package.json
├── firebase.json
└── .firebaserc
``` 