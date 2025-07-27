# Kitty FB

A Firebase Cloud Functions API for managing users and groups in a kitty (shared expenses) app.

## Features

- Create users with display name and email
- Create groups with default kitty balance
- Add users to groups with bidirectional relationships
- Create transactions with audit trail and comments
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

### Create Group
- **URL:** `{your-function-url}/groups/new`
- **Method:** POST
- **Body:**
  ```json
  {
    "name": "My Group"
  }
  ```

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
- **Response:** `200` status with `{"message": "User added to group successfully"}`
- **Error Responses:**
  - `400`: Missing userId
  - `404`: User or group not found
  - `409`: User is already a member of the group

### Create Transaction
- **URL:** `{your-function-url}/groups/{groupId}/transactions`
- **Method:** PATCH
- **Body:**
  ```json
  {
    "userId": "user123",
    "amount": 50,
    "comment": "Weekly contribution"
  }
  ```
- **Parameters:**
  - `groupId` (path parameter): The ID of the group
  - `userId` (body): The ID of the user making the transaction
  - `amount` (body): Transaction amount (positive for contributions, negative for withdrawals)
  - `comment` (body, optional): Description of the transaction
- **Response:** `200` status with `{"message": "Transaction created successfully"}`
- **Error Responses:**
  - `400`: Missing userId or amount, invalid amount type, balance validation errors
  - `404`: User or group not found, user not a member of the group
  - `500`: Server errors
- **What Gets Updated:**
  - User's balance in the group
  - Group's member balance
  - Group's total kitty balance
  - Transaction log with timestamp and comment

## Local Development

Start Firebase emulators:
```bash
firebase emulators:start --only functions
```

Local endpoints will be available at:
- `http://localhost:5001/{project-id}/us-central1/api/users/new`
- `http://localhost:5001/{project-id}/us-central1/api/groups/new`
- `http://localhost:5001/{project-id}/us-central1/api/groups/{groupId}/members`
- `http://localhost:5001/{project-id}/us-central1/api/groups/{groupId}/transactions`

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

**Create a transaction:**
1. Create new request in Postman
2. Set method to **PATCH**
3. URL: `http://localhost:5001/{project-id}/us-central1/api/groups/{groupId}/transactions`
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
     "amount": 50,
     "comment": "Weekly contribution"
   }
   ```
   - Replace `user123` with actual user ID
   - Use positive amount for contributions, negative for withdrawals
   - Comment is optional
6. Click **Send**

**Expected responses:**
- Success: `201` status with `{"userId": "..."}` or `{"groupId": "..."}`
- Success (add to group): `200` status with `{"message": "User added to group successfully"}`
- Success (transaction): `200` status with `{"message": "Transaction created successfully"}`
- Error: `400` for missing fields, `404` for not found, `409` for conflicts, `500` for server errors

## Project Structure

```
kitty-fb/
├── functions/
│   ├── src/
│   │   ├── app.ts          # Express app setup
│   │   ├── index.ts        # Firebase function entry
│   │   └── services/
│   │       ├── firestore.ts # Database operations
│   │       └── validators.ts # Validation logic
│   └── package.json
├── firebase.json
└── .firebaserc
``` 