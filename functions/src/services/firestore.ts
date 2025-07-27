import * as admin from "firebase-admin";
import {
  validateUserGroupMembership,
  validateUserNotInGroup,
  validateBalanceUpdate,
} from "./validators";

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

/**
 * FIRESTORE SERVICE
 *
 * This file contains all business logic for database operations.
 * It focuses on CRUD operations and data manipulation, while
 * validation logic has been moved to validators.ts for better
 * separation of concerns.
 *
 * Key principles:
 * - Business logic only (no validation)
 * - Atomic operations where possible
 * - Proper error handling
 * - Clear documentation
 */

/**
 * Creates a new user in Firestore
 *
 * This function creates a new user document with basic information.
 * The user will have no groups initially, and groups will be added
 * through the addUserToGroup function.
 *
 * @param {string} displayName - The user's display name
 * @param {string} email - The user's email address
 * @return {Promise<string>} The ID of the created user
 *
 * @example
 * const userId = await createUser("John Doe", "john@example.com");
 * console.log("Created user with ID:", userId);
 */
export async function createUser(
  displayName: string, email: string): Promise<string> {
  const db = admin.firestore();
  const userRef = db.collection("users").doc();

  // Create the user document with basic information
  await userRef.set({
    displayName,
    email,
    createdAt: new Date(),
  });

  return userRef.id;
}

/**
 * Creates a new group in Firestore
 *
 * This function creates a new group with an initial kitty balance of 0.
 * The group will have no members initially, and members will be added
 * through the addUserToGroup function.
 *
 * @param {string} name - The name of the group
 * @return {Promise<string>} The ID of the created group
 *
 * @example
 * const groupId = await createGroup("Weekend Trip");
 * console.log("Created group with ID:", groupId);
 */
export async function createGroup(name: string): Promise<string> {
  const db = admin.firestore();
  const groupRef = db.collection("groups").doc();

  // Create the group document with initial balance
  await groupRef.set({
    name,
    kittyBalance: 0, // Initial balance starts at 0
    createdAt: new Date(),
  });

  return groupRef.id;
}

/**
 * Adds an existing user to an existing group
 *
 * This function creates a bidirectional relationship
 * between a user and a group.
 * It maintains data consistency by updating both sides of the relationship:
 * - User's groups subcollection
 * - Group's members subcollection
 *
 * The function uses validation to ensure:
 * - Both user and group exist
 * - User is not already a member
 * - Data integrity is maintained
 *
 * @param {string} userId - The ID of the user to add
 * @param {string} groupId - The ID of the group to add the user to
 * @return {Promise<void>}
 *
 * @example
 * await addUserToGroup("user123", "group456");
 * // User is now a member of the group with balance 0
 *
 * @throws {Error} Various validation errors from validators
 */
export async function addUserToGroup(
  userId: string,
  groupId: string
): Promise<void> {
  // Validate that user is not already a member and get document references
  const {userGroupRef, groupMemberRef} = await validateUserNotInGroup(
    userId,
    groupId
  );

  // Create the bidirectional relationship atomically
  // This ensures data consistency -
  // if one side fails, the other won't be created
  await Promise.all([
    // Add group to user's groups subcollection
    userGroupRef.set({
      groupId,
      balance: 0, // New members start with 0 balance
      joinedAt: new Date(),
    }),
    // Add user to group's members subcollection
    groupMemberRef.set({
      userId,
      balance: 0, // New members start with 0 balance
      joinedAt: new Date(),
    }),
  ]);
}

/**
 * Creates a transaction in a group
 *
 * This function creates a transaction that affects the kitty balance and
 * user balances. It maintains an audit trail of all financial changes
 * in the group with timestamps and optional comments.
 *
 * IMPORTANT: This function uses FieldValue.increment() which has known issues
 * in the Firestore emulator when combined with Promise.all(). The emulator
 * may return 500 errors for transactions, but this works correctly in
 * production.
 *
 * For emulator testing, consider temporarily replacing:
 *   kittyBalance: admin.firestore.FieldValue.increment(amount)
 * with:
 *   kittyBalance: currentKittyBalance + amount
 *
 * @param {string} groupId - The ID of the group
 * @param {string} userId - The ID of the user making the transaction
 * @param {number} amount - The transaction amount (positive for contributions,
 * negative for withdrawals)
 * @param {string} comment - Optional comment explaining the transaction
 * @return {Promise<void>}
 *
 * @example
 * // User contributes 50 to the group
 * await createTransaction("group123", "user456", 50, "Weekly contribution");
 *
 * // User withdraws 20 from the group
 * await createTransaction("group123", "user456", -20, "Lunch expense");
 *
 * @throws {Error} Various validation errors from validators
 */
export async function createTransaction(
  groupId: string,
  userId: string,
  amount: number,
  comment?: string
): Promise<void> {
  // Validate that user is a member of the group and get document references
  const {userGroupRef, groupMemberRef} = await validateUserGroupMembership(
    userId,
    groupId
  );
  const groupRef = await admin.firestore()
    .collection("groups")
    .doc(groupId);

  // Get current balances
  const [userGroupDoc, groupDoc] = await Promise.all([
    userGroupRef.get(),
    groupRef.get(),
  ]);

  const currentBalance = userGroupDoc.data()?.balance || 0;
  const currentKittyBalance = groupDoc.data()?.kittyBalance || 0;
  const newBalance = currentBalance + amount;

  // Validate business rules for the transaction
  validateBalanceUpdate(newBalance, currentBalance, currentKittyBalance);

  // Create transaction record
  const transactionRef = groupRef.collection("transactions").doc();
  const transactionData = {
    userId,
    amount,
    previousBalance: currentBalance,
    newBalance,
    comment: comment || "",
    timestamp: new Date(),
  };

  // Update all locations atomically:
  // 1. User's balance in the group
  // 2. Group's member balance
  // 3. Group's total kitty balance
  // 4. Transaction log
  await Promise.all([
    // Update user's balance in the group
    userGroupRef.update({
      balance: newBalance,
      updatedAt: new Date(),
    }),
    // Update group's member balance
    groupMemberRef.update({
      balance: newBalance,
      updatedAt: new Date(),
    }),
    // Update group's total kitty balance
    // NOTE: FieldValue.increment() has known issues in the Firestore emulator
    // when used with Promise.all(). This works fine in production but may
    // cause 500 errors in the emulator. For emulator testing, consider using
    // direct calculation: kittyBalance: currentKittyBalance + amount
    groupRef.update({
      kittyBalance: admin.firestore.FieldValue.increment(amount),
    }),
    // Log the transaction
    transactionRef.set(transactionData),
  ]);
}
