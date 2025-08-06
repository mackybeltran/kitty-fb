// Set environment for integration tests (uses dev database)
process.env.NODE_ENV = "development";

import * as admin from "firebase-admin";
import * as functionsTest from "firebase-functions-test";

// Environment configuration for different databases
const getFirebaseConfig = () => {
  const environment = process.env.NODE_ENV || "development";

  switch (environment) {
  case "test":
    // Use emulators for test environment
    return {
      projectId: "demo-project",
      useEmulators: true,
    };
  case "production":
    // Use production database
    return {
      projectId: process.env.FIREBASE_PROJECT_ID_PROD || "kitty-prod",
      useEmulators: false,
    };
  case "development":
  default:
    // Use development database
    return {
      projectId: process.env.FIREBASE_PROJECT_ID_DEV || "kitty-680c6",
      useEmulators: false,
    };
  }
};

const config = getFirebaseConfig();

// Initialize Firebase test environment with project ID
const testEnv = functionsTest({projectId: config.projectId});

// Initialize Firebase Admin SDK for testing with project configuration
if (!admin.apps.length) {
  const appConfig: admin.AppOptions = {
    projectId: config.projectId,
    credential: admin.credential.applicationDefault(),
  };

  // Configure emulators if needed
  if (config.useEmulators) {
    process.env.FIRESTORE_EMULATOR_HOST = "localhost:8080";
    process.env.FUNCTIONS_EMULATOR_HOST = "localhost:5001";
  }

  admin.initializeApp(appConfig);
}

// Test utilities
export const createTestUser = async (): Promise<string> => {
  const userRef = admin.firestore().collection("users").doc();
  await userRef.set({
    displayName: "Test User",
    email: "test@example.com",
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  return userRef.id;
};

export const createTestGroup = async (): Promise<string> => {
  const groupRef = admin.firestore().collection("groups").doc();
  await groupRef.set({
    name: "Test Group",
    kittyBalance: 0,
    memberCount: 0,
    members: [],
    buckets: [],
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  return groupRef.id;
};

export const cleanupTestData = async (): Promise<void> => {
  // Clean up test data after each test
  const db = admin.firestore();

  // Clean up users
  const usersSnapshot = await db.collection("users").get();
  const userDeletes = usersSnapshot.docs.map((doc) => doc.ref.delete());

  // Clean up groups
  const groupsSnapshot = await db.collection("groups").get();
  const groupDeletes = groupsSnapshot.docs.map((doc) => doc.ref.delete());

  await Promise.all([...userDeletes, ...groupDeletes]);
};

export {testEnv, admin};
