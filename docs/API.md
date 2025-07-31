# API Reference

Complete API documentation for the Kitty FB Firebase Cloud Functions backend.

## Base URL

- **Production**: `https://api-yqyq3bmp3a-uc.a.run.app`
- **Local Development**: `http://localhost:5001/{project-id}/us-central1/api`

## Authentication

Currently, the API does not require authentication. Future versions will integrate Firebase Auth.

## Error Handling

All endpoints return standard HTTP status codes:

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `404` - Not Found
- `409` - Conflict (duplicate data)
- `500` - Internal Server Error

Error responses include a descriptive message:
```json
{
  "error": "User not found",
  "status": 404
}
```

## Endpoints

### User Management

#### Create User
- **URL:** `POST /users/new`
- **Description:** Creates a new user in the system
- **Body:**
  ```json
  {
    "displayName": "John Doe",
    "email": "john@example.com"
  }
  ```
- **Response:** `201` with `{"userId": "..."}`
- **Errors:** `400` for missing fields

#### Get User Details
- **URL:** `GET /users/{userId}`
- **Description:** Retrieves user details including group memberships
- **Response:** User object with groups, balances, and active buckets
- **Errors:** `404` if user not found

### Group Management

#### Create Group
- **URL:** `POST /groups/new`
- **Description:** Creates a new group with initial kitty balance of 0
- **Body:**
  ```json
  {
    "name": "My Group"
  }
  ```
- **Response:** `201` with `{"groupId": "..."}`
- **Errors:** `400` for missing name

#### Get Group Details
- **URL:** `GET /groups/{groupId}`
- **Description:** Retrieves complete group information
- **Response:** Group details with members, buckets, and kitty balance
- **Errors:** `404` if group not found

#### Get Group Members
- **URL:** `GET /groups/{groupId}/members`
- **Description:** Lists all group members with their details
- **Response:** Array of member objects
- **Errors:** `404` if group not found

### Group Membership

#### Add User to Group
- **URL:** `POST /groups/{groupId}/members`
- **Description:** Adds an existing user to a group
- **Body:**
  ```json
  {
    "userId": "user123"
  }
  ```
- **Parameters:**
  - `is_admin` (optional): Whether user should be admin (only for non-first users)
- **Response:** `200` with success message
- **Errors:** `400`, `404`, `409` for various validation failures

### Bucket Management

#### Purchase Buckets
- **URL:** `POST /groups/{groupId}/buckets`
- **Description:** Purchases multiple buckets of the same size for a user
- **Body:**
  ```json
  {
    "userId": "user123",
    "bucketCount": 5,
    "unitsPerBucket": 8
  }
  ```
- **Response:** `200` with `{"bucketIds": ["...", "..."]}`
- **Errors:** `400` for invalid values, `404` if user/group not found

#### Get User Buckets
- **URL:** `GET /groups/{groupId}/members/{userId}/buckets`
- **Description:** Retrieves all buckets for a user in a group
- **Response:** Array of bucket objects with remaining units
- **Errors:** `404` if user/group not found

### Consumption Tracking

#### Record Consumption
- **URL:** `POST /groups/{groupId}/consumption`
- **Description:** Records consumption of units from user's active bucket
- **Body:**
  ```json
  {
    "userId": "user123",
    "units": 2
  }
  ```
- **Response:** `200` with success message
- **Errors:** `400` for insufficient units or no active bucket

#### Get Group Consumption History
- **URL:** `GET /groups/{groupId}/consumption`
- **Description:** Retrieves consumption history for a group
- **Response:** Array of consumption records with timestamps
- **Errors:** `404` if group not found

### Balance Management

#### Update User Balance
- **URL:** `PATCH /groups/{groupId}/members/{userId}/balance`
- **Description:** Updates user's debt balance (admin-only)
- **Body:**
  ```json
  {
    "amount": -20,
    "adminUserId": "admin123"
  }
  ```
- **Response:** `200` with success message
- **Errors:** `400` for invalid amount or non-admin user

### Kitty Transactions

#### Create Kitty Transaction
- **URL:** `POST /groups/{groupId}/transactions`
- **Description:** Records a payment to the group's kitty balance
- **Body:**
  ```json
  {
    "userId": "user123",
    "amount": 25,
    "comment": "Payment for buckets"
  }
  ```
- **Response:** `200` with `{"transactionId": "...", "message": "..."}`
- **Errors:** `400` for invalid amount or user not in group

#### Get Group Transaction History
- **URL:** `GET /groups/{groupId}/transactions`
- **Description:** Retrieves all transactions for a group
- **Response:** Array of transaction records with amounts and comments
- **Errors:** `404` if group not found

### Join Requests

#### Create Join Request
- **URL:** `POST /groups/{groupId}/join-requests`
- **Description:** Creates a request to join a group
- **Body:**
  ```json
  {
    "userId": "user123",
    "message": "I want to join this group!"
  }
  ```
- **Response:** `200` with `{"requestId": "...", "message": "..."}`
- **Errors:** `400` for duplicate requests, `409` if already a member

#### Get Join Requests
- **URL:** `GET /groups/{groupId}/join-requests`
- **Description:** Retrieves all join requests for a group
- **Response:** Array of join request objects with status and messages
- **Errors:** `404` if group not found

#### Approve Join Request
- **URL:** `POST /groups/{groupId}/join-requests/{requestId}/approve`
- **Description:** Approves a join request and adds user to group (admin-only)
- **Body:**
  ```json
  {
    "adminUserId": "admin123",
    "reason": "Welcome to the team!"
  }
  ```
- **Response:** `200` with success message
- **Errors:** `400` for non-admin user or invalid request

#### Deny Join Request
- **URL:** `POST /groups/{groupId}/join-requests/{requestId}/deny`
- **Description:** Denies a join request (admin-only)
- **Body:**
  ```json
  {
    "adminUserId": "admin123",
    "reason": "Team is full at the moment"
  }
  ```
- **Response:** `200` with success message
- **Errors:** `400` for non-admin user or missing reason

## Development Utilities

⚠️ **WARNING: These utilities are for development/testing only and will modify database data.**

Available only when `NODE_ENV=development` or `ENABLE_DEV_UTILITIES=true`.

### Check Dev Utilities Status
- **URL:** `GET /dev/status`
- **Response:** Shows if dev utilities are available

### Get Database Statistics
- **URL:** `GET /dev/stats`
- **Response:** Database statistics (user count, group count, bucket count, etc.)

### Wipe Database
- **URL:** `DELETE /dev/wipe`
- **Response:** Confirmation of wiped collections

### Seed Database
- **URL:** `POST /dev/seed`
- **Body:** `{"userCount": 5, "groupCount": 3, "maxUsersPerGroup": 4}`
- **Response:** Created test data with users, groups, and initial buckets

### Reset Database
- **URL:** `POST /dev/reset`
- **Body:** `{"collections": ["users", "groups"], "seedOptions": {...}}`
- **Response:** Reset confirmation and created test data

## Testing with Postman

### Environment Setup
1. Create a new environment in Postman
2. Add variable `baseUrl` with your function URL
3. Use `{{baseUrl}}` in your requests

### Example Collection
```json
{
  "info": {
    "name": "Kitty FB API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Create User",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"displayName\": \"John Doe\",\n  \"email\": \"john@example.com\"\n}"
        },
        "url": {
          "raw": "{{baseUrl}}/users/new",
          "host": ["{{baseUrl}}"],
          "path": ["users", "new"]
        }
      }
    }
  ]
}
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

### Admin System
- First user added to a group automatically becomes admin
- Only one admin per group
- Every group must have an admin
- Users can be admin of one group, member of others
- Admins can approve/deny join requests
- Admins can update user balances and track kitty transactions

### Join Request System
- Users must request to join groups (no direct access)
- Admins review and approve/deny requests
- Prevents duplicate join requests from same user
- Maintains audit trail of all requests and decisions
- Automatic user addition upon approval 