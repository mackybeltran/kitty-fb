import * as admin from "firebase-admin";

/**
 * VALIDATION SERVICE
 *
 * This file contains all database validation functions used across the
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
 * This function is used as a building block for other validations.
 * It performs a database lookup and throws a descriptive error if
 * the user doesn't exist, making debugging easier.
 *
 * @param {string} userId - The user ID to validate
 * @return {Promise<admin.firestore.DocumentReference>} The user document
 * reference if found
 * @throws {Error} "User not found" if the user doesn't exist
 *
 * @example
 * // Basic usage
 * const userRef = await validateUserExists("user123");
 *
 * // In a try-catch block
 * try {
 *   const userRef = await validateUserExists("user123");
 *   // User exists, proceed with operations
 * } catch (error) {
 *   // Handle "User not found" error
 * }
 */
export async function validateUserExists(
  userId: string
): Promise<admin.firestore.DocumentReference> {
  const db = admin.firestore();
  const userRef = db.collection("users").doc(userId);
  const userDoc = await userRef.get();

  if (!userDoc.exists) {
    throw new Error("User not found");
  }

  return userRef;
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
 * @throws {Error} "User not found" if user doesn't exist
 * @throws {Error} "Group not found" if group doesn't exist
 * @throws {Error} "User is not a member of this group"
 * if membership doesn't exist
 *
 * @example
 * // Check if user is member before updating balance
 * const {userGroupRef, groupMemberRef} = await validateUserGroupMembership(
 *   "user123",
 *   "group456"
 * );
 * // Now you can safely update both sides of the relationship
 */
export async function validateUserGroupMembership(
  userId: string,
  groupId: string
): Promise<{
  userGroupRef: admin.firestore.DocumentReference;
  groupMemberRef: admin.firestore.DocumentReference;
}> {
  // First validate that both entities exist
  const userRef = await validateUserExists(userId);
  const groupRef = await validateGroupExists(groupId);

  // Get references to both sides of the relationship
  const userGroupRef = userRef.collection("groups").doc(groupId);
  const groupMemberRef = groupRef.collection("members").doc(userId);

  // Check both sides of the bidirectional relationship
  // This ensures data consistency and catches any orphaned records
  const [userGroupDoc, groupMemberDoc] = await Promise.all([
    userGroupRef.get(),
    groupMemberRef.get(),
  ]);

  // If either side is missing, the relationship is invalid
  if (!userGroupDoc.exists || !groupMemberDoc.exists) {
    throw new Error("User is not a member of this group");
  }

  return {userGroupRef, groupMemberRef};
}

/**
 * Validates that a user is NOT already a member of a group
 *
 * This function is the opposite of validateUserGroupMembership.
 * It's used when adding a user to a group to prevent duplicate memberships.
 *
 * The function validates that both entities exist, then checks that
 * neither side of the relationship exists yet.
 *
 * @param {string} userId - The user ID
 * @param {string} groupId - The group ID
 * @return {Promise<{userGroupRef: admin.firestore.DocumentReference,
 * groupMemberRef: admin.firestore.DocumentReference}>}
 *         Document references for creating the new relationship
 * @throws {Error} "User not found" if user doesn't exist
 * @throws {Error} "Group not found" if group doesn't exist
 * @throws {Error} "User is already a member of this group"
 * if membership already exists
 *
 * @example
 * // Check before adding user to group
 * const {userGroupRef, groupMemberRef} = await validateUserNotInGroup(
 *   "user123",
 *   "group456"
 * );
 * // Now you can safely create the membership on both sides
 */
export async function validateUserNotInGroup(
  userId: string,
  groupId: string
): Promise<{
  userGroupRef: admin.firestore.DocumentReference;
  groupMemberRef: admin.firestore.DocumentReference;
}> {
  // First validate that both entities exist
  const userRef = await validateUserExists(userId);
  const groupRef = await validateGroupExists(groupId);

  // Get references to both sides of the relationship
  const userGroupRef = userRef.collection("groups").doc(groupId);
  const groupMemberRef = groupRef.collection("members").doc(userId);

  // Check if the relationship already exists on either side
  const [userGroupDoc, groupMemberDoc] = await Promise.all([
    userGroupRef.get(),
    groupMemberRef.get(),
  ]);

  // If either side exists, the user is already a member
  if (userGroupDoc.exists || groupMemberDoc.exists) {
    throw new Error("User is already a member of this group");
  }

  return {userGroupRef, groupMemberRef};
}

/**
 * Validates balance update business rules
 *
 * This function validates the business logic for updating a user's balance:
 * - New balance cannot be negative
 * - User cannot withdraw more than their current balance
 * - The resulting kitty balance cannot be negative
 *
 * @param {number} newBalance - The new balance amount
 * @param {number} currentBalance - The user's current balance
 * @param {number} currentKittyBalance - The group's current kitty balance
 * @throws {Error} Various validation errors for business rule violations
 */
export function validateBalanceUpdate(
  newBalance: number,
  currentBalance: number,
  currentKittyBalance: number
): void {
  // Validate that balance is not negative
  if (newBalance < 0) {
    throw new Error("Balance cannot be less than 0");
  }

  const balanceDifference = newBalance - currentBalance;

  // Validate withdrawal doesn't exceed current balance
  if (balanceDifference < 0 && Math.abs(balanceDifference) > currentBalance) {
    throw new Error("Cannot withdraw more than current balance");
  }

  // Validate the resulting kitty balance won't be negative
  const newKittyBalance = currentKittyBalance + balanceDifference;
  if (newKittyBalance < 0) {
    throw new Error("Insufficient funds in kitty");
  }
}
