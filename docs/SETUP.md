# Setup Guide

Complete setup instructions for the Kitty FB Firebase Cloud Functions project.

## Prerequisites

- Node.js 18+ installed
- Firebase CLI installed (`npm install -g firebase-tools`)
- Google account with billing enabled

## Firebase Console Setup

### 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click "Add project"
3. Enter project name (e.g., "kitty-fb")
4. Follow the setup wizard
5. Note your project ID for later use

### 2. Upgrade to Blaze Plan

**Required for Cloud Functions**

1. In Firebase Console, go to "Usage and billing"
2. Click "Upgrade" to Blaze (pay-as-you-go) plan
3. Add payment method (required, but generous free tier)
4. Complete the upgrade process

### 3. Set Up Billing Protection (Recommended)

1. Go to [Google Cloud Console](https://console.cloud.google.com/billing)
2. Select your Firebase project's billing account
3. Create a budget with $1.00 cap
4. Set up "Disable billing" action at 100% threshold
5. Add email alerts at 50% and 90%

### 4. Enable Required APIs

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select your Firebase project
3. Navigate to "APIs & Services" > "Library"
4. Enable the following APIs:
   - Cloud Functions API
   - Cloud Build API
   - Firestore API
   - Identity and Access Management (IAM) API

## Local Project Setup

### 1. Clone and Initialize

```bash
# Clone the repository
git clone <repository-url>
cd kitty-fb

# Install Firebase CLI if not already installed
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase in the project
firebase init
```

### 2. Firebase Init Configuration

When running `firebase init`, select:

- **Features**: Functions, Firestore
- **Project**: Select your Firebase project
- **Language**: TypeScript
- **ESLint**: Yes
- **Install dependencies**: Yes

### 3. Install Dependencies

```bash
cd functions
npm install
```

### 4. Environment Configuration

Create environment file for development:

```bash
# Copy example environment file
cp env.example .env

# Edit .env file
nano .env
```

Add the following to `.env`:
```bash
# Enable development utilities
ENABLE_DEV_UTILITIES=true
NODE_ENV=development

# Firebase project ID
FIREBASE_PROJECT_ID=your-project-id
```

## Firestore Database Setup

### 1. Create Firestore Database

1. In Firebase Console, go to "Firestore Database"
2. Click "Create database"
3. Choose "Start in test mode" (for development)
4. Select a location (choose closest to your users)

### 2. Security Rules

Update Firestore security rules in `firestore.rules`:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow read/write access to all users under any document
    // WARNING: This is for development only!
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

**⚠️ Important**: These rules allow full access for development. For production, implement proper authentication and authorization rules.

### 3. Create Required Indexes

The application will automatically create required indexes when you first use certain queries. If you encounter index errors:

1. Click the link in the error message
2. Follow the Firebase Console prompts
3. Wait for indexes to build (usually 1-5 minutes)

## Deployment

### 1. Build Functions

```bash
cd functions
npm run build
```

### 2. Deploy to Firebase

```bash
# Deploy only functions
firebase deploy --only functions

# Or deploy everything
firebase deploy
```

### 3. Verify Deployment

After deployment, you'll see output like:
```
✔  functions[api(us-central1)] Successful create operation.
Function URL (api(us-central1)): https://your-project-id.cloudfunctions.net
```

### 4. Test the API

```bash
# Test the API is working
curl -X GET https://your-project-id.cloudfunctions.net/dev/stats
```

## Development Environment

### 1. Start Local Emulators

```bash
# Start Firebase emulators
firebase emulators:start --only functions,firestore
```

### 2. Local API Endpoints

When using emulators, your API will be available at:
- `http://localhost:5001/{project-id}/us-central1/api`

### 3. Emulator UI

Access the emulator UI at:
- `http://localhost:4000`

## Production Deployment

### 1. Environment Variables

For production, ensure:
- `NODE_ENV=production` (default)
- `ENABLE_DEV_UTILITIES` is NOT set to `true`

### 2. Security Rules

Update Firestore rules for production:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Implement proper authentication and authorization
    // This is just an example - customize for your needs
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    match /groups/{groupId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### 3. Deploy to Production

```bash
# Set production environment
export NODE_ENV=production

# Deploy
firebase deploy --only functions
```

## Troubleshooting

### Common Issues

#### 1. Billing Not Enabled
**Error**: "Billing account not configured"
**Solution**: Enable billing in Firebase Console

#### 2. Functions Deploy Fails
**Error**: "Build failed"
**Solution**: 
```bash
cd functions
npm install
npm run build
firebase deploy --only functions
```

#### 3. Index Errors
**Error**: "The query requires an index"
**Solution**: 
1. Click the link in the error message
2. Create the index in Firebase Console
3. Wait for it to build

#### 4. Permission Denied
**Error**: "Permission denied"
**Solution**: 
1. Check Firebase project selection: `firebase use`
2. Verify you're logged in: `firebase login`
3. Check project permissions in Firebase Console

#### 5. Emulator Issues
**Error**: "Port already in use"
**Solution**: 
```bash
# Kill existing processes
lsof -ti:5001 | xargs kill -9
lsof -ti:4000 | xargs kill -9

# Restart emulators
firebase emulators:start
```

### Getting Help

1. Check Firebase documentation: [firebase.google.com/docs](https://firebase.google.com/docs)
2. Review error logs in Firebase Console
3. Check function logs: `firebase functions:log`
4. Create an issue in the project repository

## Next Steps

After setup is complete:

1. **Test the API**: Use the [API Reference](API.md) to test endpoints
2. **Seed Test Data**: Use `/dev/seed` endpoint to create test data
3. **Build Frontend**: Follow the [Frontend Guide](FRONTEND_GUIDE.md)
4. **Monitor Usage**: Check Firebase Console for usage and billing

## Security Considerations

### Development
- Firestore rules allow full access
- Dev utilities are enabled
- No authentication required

### Production
- Implement proper Firestore security rules
- Add Firebase Authentication
- Disable dev utilities
- Set up proper CORS configuration
- Monitor function usage and costs 