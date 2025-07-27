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

/**
 * Adds an existing user to an existing group
 * @param {string} userId - The ID of the user to add
 * @param {string} groupId - The ID of the group to add the user to
 * @return {Promise<void>}
 */
export async function addUserToGroup(
  userId: string,
  groupId: string
): Promise<void> {
  const db = admin.firestore();

  // Check if user exists
  const userRef = db.collection("users").doc(userId);
  const userDoc = await userRef.get();
  if (!userDoc.exists) {
    throw new Error("User not found");
  }

  // Check if group exists
  const groupRef = db.collection("groups").doc(groupId);
  const groupDoc = await groupRef.get();
  if (!groupDoc.exists) {
    throw new Error("Group not found");
  }

  // Check if user is already a member of the group (check both sides)
  const userGroupRef = userRef.collection("groups").doc(groupId);
  const groupMemberRef = groupRef.collection("members").doc(userId);

  const [userGroupDoc, groupMemberDoc] = await Promise.all([
    userGroupRef.get(),
    groupMemberRef.get(),
  ]);

  if (userGroupDoc.exists || groupMemberDoc.exists) {
    throw new Error("User is already a member of this group");
  }

  // Add user to group (bidirectional relationship)
  await Promise.all([
    // Add group to user's groups subcollection
    userGroupRef.set({
      groupId,
      balance: 0,
      joinedAt: new Date(),
    }),
    // Add user to group's members subcollection
    groupMemberRef.set({
      userId,
      balance: 0,
      joinedAt: new Date(),
    }),
  ]);
}
