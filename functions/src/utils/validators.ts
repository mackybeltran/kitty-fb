import * as admin from "firebase-admin";

/**
 * VALIDATION UTILITIES
 *
 * This file contains all database validation utility functions used across the
 * application. These functions handle common validation patterns like
 * checking if entities exist and validating relationships between
 * entities.
 *
 * Benefits of centralizing validations:
 * - Single source of truth for validation logic
 * - Reusable across different services
 * - Easier to test and maintain
 * - Consistent error messages
 * - Better separation of concerns
 */

/**
 * Validates that a user exists in the database
 *
 * This function checks if a user exists and returns both the document
 * reference and the document data for further operations.
 *
 * @param {string} userId - The user ID to validate
 * @return {Promise<{ref: admin.firestore.DocumentReference, data: any}>}
 * Object containing the user document reference and data if found
 * @throws {Error} "User not found" if the user doesn't exist
 *
 * @example
 * // Basic usage
 * const { ref: userRef, data: userData } = await validateUserExists("user123");
 *
 * // Use the reference for further operations
 * await userRef.update({ displayName: "New Name" });
 *
 * // Use the data for validation or processing
 * if (userData.email) {
 *   console.log("User email:", userData.email);
 * }
 */
export async function validateUserExists(
  userId: string
): Promise<{ ref: admin.firestore.DocumentReference; data: any }> {
  const db = admin.firestore();
  const userRef = db.collection("users").doc(userId);
  const userDoc = await userRef.get();

  if (!userDoc.exists) {
    throw new Error("User not found");
  }

  return {ref: userRef, data: userDoc.data()};
}

/**
 * Validates that a group exists in the database
 *
 * Similar to validateUserExists, this function checks if a group exists
 * and returns the document reference for further operations.
 *
 * @param {string} groupId - The group ID to validate
 * @return {Promise<admin.firestore.DocumentReference>} The group document
 * reference if found
 * @throws {Error} "Group not found" if the group doesn't exist
 *
 * @example
 * const groupRef = await validateGroupExists("group456");
 */
export async function validateGroupExists(
  groupId: string
): Promise<admin.firestore.DocumentReference> {
  const db = admin.firestore();
  const groupRef = db.collection("groups").doc(groupId);
  const groupDoc = await groupRef.get();

  if (!groupDoc.exists) {
    throw new Error("Group not found");
  }

  return groupRef;
}

/**
 * Validates that a user is a member of a specific group
 *
 * This function performs a comprehensive check:
 * 1. Validates that both user and group exist
 * 2. Checks the bidirectional relationship (user's groups AND group's members)
 * 3. Returns document references for both sides of the relationship
 *
 * This is used when you need to perform operations on an existing membership,
 * like updating balances or removing users from groups.
 *
 * @param {string} userId - The user ID
 * @param {string} groupId - The group ID
 * @return {Promise<{userGroupRef: admin.firestore.DocumentReference,
 * groupMemberRef: admin.firestore.DocumentReference}>}
 * Document references for both sides of the relationship
 * @throws {Error} "User not found" if the user doesn't exist
 * @throws {Error} "Group not found" if the group doesn't exist
 * @throws {Error} "User is not a member of this group" if the relationship
 * doesn't exist
 *
 * @example
 * // Basic usage
 * const { userGroupRef, groupMemberRef } = await validateUserGroupMembership(
 *   "user123", "group456"
 * );
 *
 * // Use the references for further operations
 * await userGroupRef.update({ balance: 100 });
 * await groupMemberRef.update({ balance: 100 });
 */
export async function validateUserGroupMembership(
  userId: string,
  groupId: string
): Promise<{
  userGroupRef: admin.firestore.DocumentReference;
  groupMemberRef: admin.firestore.DocumentReference;
}> {
  const db = admin.firestore();
  const userGroupRef = db.collection("users").doc(userId)
    .collection("groups").doc(groupId);
  const groupMemberRef = db.collection("groups").doc(groupId)
    .collection("members").doc(userId);

  const [userGroupDoc, groupMemberDoc] = await Promise.all([
    userGroupRef.get(),
    groupMemberRef.get(),
  ]);

  if (!userGroupDoc.exists || !groupMemberDoc.exists) {
    throw new Error("User is not a member of this group");
  }

  return {userGroupRef, groupMemberRef};
}

/**
 * Validates that a user is NOT a member of a specific group
 *
 * This function is used when adding a new user to a group to ensure
 * they aren't already a member. It performs the same comprehensive
 * check as validateUserGroupMembership but expects the relationship
 * to NOT exist.
 *
 * @param {string} userId - The user ID
 * @param {string} groupId - The group ID
 * @return {Promise<{userGroupRef: admin.firestore.DocumentReference,
 * groupMemberRef: admin.firestore.DocumentReference}>}
 * Document references for both sides of the relationship
 * @throws {Error} "User not found" if the user doesn't exist
 * @throws {Error} "Group not found" if the group doesn't exist
 * @throws {Error} "User is already a member of this group" if the relationship
 * already exists
 *
 * @example
 * // Before adding a user to a group
 * const { userGroupRef, groupMemberRef } = await validateUserNotInGroup(
 *   "user123", "group456"
 * );
 *
 * // Now safe to add the user
 * await userGroupRef.set({ userId, groupId, balance: 0 });
 * await groupMemberRef.set({ userId, groupId, balance: 0 });
 */
export async function validateUserNotInGroup(
  userId: string,
  groupId: string
): Promise<{
  userGroupRef: admin.firestore.DocumentReference;
  groupMemberRef: admin.firestore.DocumentReference;
}> {
  const db = admin.firestore();
  const userGroupRef = db.collection("users").doc(userId)
    .collection("groups").doc(groupId);
  const groupMemberRef = db.collection("groups").doc(groupId)
    .collection("members").doc(userId);

  const [userGroupDoc, groupMemberDoc] = await Promise.all([
    userGroupRef.get(),
    groupMemberRef.get(),
  ]);

  if (userGroupDoc.exists || groupMemberDoc.exists) {
    throw new Error("User is already a member of this group");
  }

  return {userGroupRef, groupMemberRef};
}

/**
 * Validates that a group has exactly one admin
 *
 * This function ensures that the admin flag logic is maintained:
 * - Only one admin per group
 * - Every group must have an admin
 *
 * @param {string} groupId - The group ID
 * @param {boolean} isAdmin - Whether the user being added should be admin
 * @throws {Error} "Group already has an admin" if trying to add a second admin
 * @throws {Error} "Group must have an admin" if removing the only admin
 *
 * @example
 * // When adding a user as admin
 * await validateSingleAdmin("group456", true);
 *
 * // When adding a user as non-admin
 * await validateSingleAdmin("group456", false);
 */
export async function validateSingleAdmin(
  groupId: string,
  isAdmin: boolean
): Promise<void> {
  const db = admin.firestore();
  const groupRef = db.collection("groups").doc(groupId);
  const membersSnapshot = await groupRef.collection("members").get();

  const adminMembers = membersSnapshot.docs.filter(
    (doc) => doc.data().isAdmin === true
  );

  if (isAdmin && adminMembers.length > 0) {
    throw new Error("Group already has an admin");
  }

  if (!isAdmin && adminMembers.length === 0) {
    throw new Error("Group must have an admin");
  }
}

/**
 * Validates that a user is a group admin
 *
 * This function ensures that a user is both a member of the group
 * and has admin privileges. It's used for operations that require
 * admin permissions like approving join requests or updating
 * balances.
 *
 * @param {string} userId - The user ID to validate
 * @param {string} groupId - The group ID to validate
 * @throws {Error} "User is not a member of this group" if user is not a member
 * @throws {Error} "Only group admins can perform this action" if user is
 * not admin
 *
 * @example
 * // Before approving a join request
 * await validateUserIsGroupAdmin("admin123", "group456");
 */
export async function validateUserIsGroupAdmin(
  userId: string,
  groupId: string
): Promise<void> {
  const {groupMemberRef} = await validateUserGroupMembership(userId, groupId);
  const memberData = (await groupMemberRef.get()).data();

  if (!memberData?.isAdmin) {
    throw new Error("Only group admins can perform this action");
  }
}
