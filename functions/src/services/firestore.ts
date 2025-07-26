import * as admin from "firebase-admin";

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

/**
 * Creates a new user in Firestore
 * @param {string} displayName - The user's display name
 * @param {string} email - The user's email address
 * @return {Promise<string>} The ID of the created user
 */
export async function createUser(
  displayName: string, email: string): Promise<string> {
  const db = admin.firestore();
  const userRef = db.collection("users").doc();
  await userRef.set({
    displayName,
    email,
    createdAt: new Date(),
  });
  return userRef.id;
}

/**
 * Creates a new group in Firestore
 * @param {string} name - The name of the group
 * @return {Promise<string>} The ID of the created group
 */
export async function createGroup(name: string): Promise<string> {
  const db = admin.firestore();
  const groupRef = db.collection("groups").doc();
  await groupRef.set({
    name,
    kittyBalance: 0, // Assuming a default balance of 0
    createdAt: new Date(),
  });
  return groupRef.id;
}
