// Set environment for unit tests (uses emulators)
process.env.NODE_ENV = 'test';

import * as admin from 'firebase-admin';
import * as functionsTest from 'firebase-functions-test';

// Environment configuration for different databases
const getFirebaseConfig = () => {
  const environment = process.env.NODE_ENV || 'test';
  
  switch (environment) {
    case 'test':
      // Use emulators for test environment
      return {
        projectId: 'demo-project',
        useEmulators: true
      };
    case 'production':
      // Use production database
      return {
        projectId: process.env.FIREBASE_PROJECT_ID_PROD || 'kitty-prod',
        useEmulators: false
      };
    case 'development':
    default:
      // Use development database
      return {
        projectId: process.env.FIREBASE_PROJECT_ID_DEV || 'kitty-680c6',
        useEmulators: false
      };
  }
};

const config = getFirebaseConfig();

// Check if emulators are running
const checkEmulatorHealth = async (): Promise<boolean> => {
  try {
    const response = await fetch('http://localhost:8080');
    return response.ok;
  } catch (error) {
    console.warn('Firestore emulator not running on localhost:8080');
    return false;
  }
};

const testEnv = functionsTest({ projectId: config.projectId });
if (!admin.apps.length) {
  const appConfig: admin.AppOptions = {
    projectId: config.projectId,
    credential: admin.credential.applicationDefault(),
  };

  // Configure emulators if needed
  if (config.useEmulators) {
    process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
    process.env.FUNCTIONS_EMULATOR_HOST = 'localhost:5001';
  }

  admin.initializeApp(appConfig);
}

// Track test data for more efficient cleanup
let testDataIds: { users: string[], groups: string[] } = {
  users: [],
  groups: []
};

// Test utilities for unit tests
export const createTestUser = async (): Promise<string> => {
  const userRef = admin.firestore().collection('users').doc();
  await userRef.set({
    displayName: 'Test User',
    email: 'test@example.com',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  testDataIds.users.push(userRef.id);
  return userRef.id;
};

export const createTestGroup = async (): Promise<string> => {
  const groupRef = admin.firestore().collection('groups').doc();
  await groupRef.set({
    name: 'Test Group',
    kittyBalance: 0,
    memberCount: 0,
    members: [],
    buckets: [],
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  testDataIds.groups.push(groupRef.id);
  return groupRef.id;
};

export const cleanupTestData = async (): Promise<void> => {
  // Check emulator health first
  const emulatorRunning = await checkEmulatorHealth();
  if (!emulatorRunning) {
    console.warn('Skipping cleanup - emulator not running');
    return;
  }

  const db = admin.firestore();
  
  try {
    // Clean up tracked test data first (more efficient)
    const trackedDeletes: Promise<any>[] = [];
    
    // Clean up tracked users
    for (const userId of testDataIds.users) {
      trackedDeletes.push(db.collection('users').doc(userId).delete());
    }
    
    // Clean up tracked groups
    for (const groupId of testDataIds.groups) {
      trackedDeletes.push(db.collection('groups').doc(groupId).delete());
    }
    
    if (trackedDeletes.length > 0) {
      await Promise.all(trackedDeletes);
    }
    
    // Reset tracked IDs
    testDataIds = { users: [], groups: [] };
    
    // Fallback: clean up any remaining test data (less frequent)
    if (Math.random() < 0.1) { // Only 10% of the time
      const usersSnapshot = await db.collection('users').get();
      const userDeletes = usersSnapshot.docs.map(doc => doc.ref.delete());
      
      const groupsSnapshot = await db.collection('groups').get();
      const groupDeletes = groupsSnapshot.docs.map(doc => doc.ref.delete());
      
      await Promise.all([...userDeletes, ...groupDeletes]);
    }
  } catch (error) {
    console.warn('Cleanup failed:', error);
    // Don't throw - cleanup failures shouldn't fail tests
  }
};

export { testEnv, admin }; 