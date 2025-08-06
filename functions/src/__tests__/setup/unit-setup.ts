// Set environment for unit tests (uses dev database)
process.env.NODE_ENV = "development";
process.env.ENABLE_DEV_UTILITIES = "true";

import * as admin from "firebase-admin";
import * as functionsTest from "firebase-functions-test";
import {
  createUser,
  updateUserProfile,
  findUserByPhoneNumber,
} from "../../services/firestore";

// Environment configuration - always use development database for tests
const getFirebaseConfig = () => {
  return {
    projectId: process.env.FIREBASE_PROJECT_ID_DEV || "kitty-680c6",
    useEmulators: false,
  };
};

const config = getFirebaseConfig();

// Initialize Firebase test environment with project ID
const testEnv = functionsTest({projectId: config.projectId});

// Delete any existing apps to ensure clean initialization
admin.apps.forEach((app) => {
  if (app) app.delete();
});

const appConfig: admin.AppOptions = {
  projectId: config.projectId,
  credential: admin.credential.applicationDefault(),
};

admin.initializeApp(appConfig);

// Track test data for more efficient cleanup
let testDataIds: { users: string[], groups: string[] } = {
  users: [],
  groups: [],
};

// Test utilities for unit tests
export const createTestUser = async (): Promise<string> => {
  const userRef = admin.firestore().collection("users").doc();
  await userRef.set({
    displayName: "Test User",
    email: "test@example.com",
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  testDataIds.users.push(userRef.id);
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
  testDataIds.groups.push(groupRef.id);
  return groupRef.id;
};

export const cleanupTestData = async (): Promise<void> => {
  const db = admin.firestore();

  try {
    // Clean up tracked test data first (faster)
    if (testDataIds.users.length > 0 || testDataIds.groups.length > 0) {
      const userDeletes = testDataIds.users.map((id) =>
        db.collection("users").doc(id).delete()
      );
      const groupDeletes = testDataIds.groups.map((id) =>
        db.collection("groups").doc(id).delete()
      );
      await Promise.all([...userDeletes, ...groupDeletes]);
      testDataIds = { users: [], groups: [] };
      return;
    }

    // Fallback: clean up all test data (slower but thorough)
    const usersSnapshot = await db.collection("users").get();
    const userDeletes = usersSnapshot.docs.map((doc) => doc.ref.delete());

    const groupsSnapshot = await db.collection("groups").get();
    const groupDeletes = groupsSnapshot.docs.map((doc) => doc.ref.delete());

    await Promise.all([...userDeletes, ...groupDeletes]);
  } catch (error) {
    console.warn("Cleanup failed:", error);
  }
};

// Export Firestore service functions for testing
export {
  createUser,
  updateUserProfile,
  findUserByPhoneNumber,
};

export {testEnv, admin};
