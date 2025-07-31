import * as admin from "firebase-admin";
import * as QRCode from "qrcode";
import {
  validateUserGroupMembership,
  validateUserNotInGroup,
  validateSingleAdmin,
  validateUserIsGroupAdmin,
  validateGroupExists,
  validateUserExists,
} from "../utils/validators";

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
  displayName: string,
  email: string
): Promise<string> {
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
 * @param {boolean} isAdmin - Whether the user should be a group admin
 * @return {Promise<void>}
 *
 * @example
 * await addUserToGroup("user123", "group456", true);
 * console.log("User added to group as admin successfully");
 *
 * @throws {Error} Various validation errors from validators
 */
export async function addUserToGroup(
  userId: string,
  groupId: string,
  isAdmin?: boolean
): Promise<void> {
  // Validate that user is not already a member and get document references
  const {userGroupRef, groupMemberRef} = await validateUserNotInGroup(
    userId,
    groupId
  );

  const db = admin.firestore();
  const groupRef = db.collection("groups").doc(groupId);
  const membersSnapshot = await groupRef.collection("members").get();

  // Determine if this user should be admin
  let shouldBeAdmin = isAdmin;

  if (membersSnapshot.empty) {
    // First user in group - automatically becomes admin
    shouldBeAdmin = true;
  } else if (isAdmin === true) {
    // User explicitly wants to be admin, but group already has members
    // Validate that only one admin can exist per group
    await validateSingleAdmin(groupId, true);
  } else {
    // Not first user and not explicitly requesting admin - must be false
    shouldBeAdmin = false;
  }

  // Create the bidirectional relationship atomically
  // This ensures data consistency -
  // if one side fails, the other won't be created
  await Promise.all([
    // Add group to user's groups subcollection
    userGroupRef.set({
      groupId,
      activeBucketId: null, // No active bucket initially
      balance: 0, // Initial balance starts at 0 (no debt)
      isAdmin: shouldBeAdmin, // Group admin flag
      joinedAt: new Date(),
    }),
    // Add user to group's members subcollection
    groupMemberRef.set({
      userId,
      activeBucketId: null, // No active bucket initially
      balance: 0, // Initial balance starts at 0 (no debt)
      isAdmin: shouldBeAdmin, // Group admin flag
      joinedAt: new Date(),
    }),
  ]);
}

/**
 * Purchases buckets for a user in a group
 *
 * This function allows users to purchase multiple buckets of the same size.
 * Each bucket is tracked individually with its own remaining units.
 * The first bucket becomes the user's active bucket.
 *
 * @param {string} groupId - The ID of the group
 * @param {string} userId - The ID of the user purchasing buckets
 * @param {number} bucketCount - Number of buckets to purchase
 * @param {number} unitsPerBucket - Units in each bucket
 * @return {Promise<string[]>} Array of bucket IDs created
 *
 * @example
 * const bucketIds = await purchaseBuckets("group123", "user456", 5, 8);
 * console.log("Purchased 5 buckets of 8 units each:", bucketIds);
 *
 * @throws {Error} Various validation errors from validators
 */
export async function purchaseBuckets(
  groupId: string,
  userId: string,
  bucketCount: number,
  unitsPerBucket: number
): Promise<string[]> {
  // Validate that user is a member of the group
  await validateUserGroupMembership(userId, groupId);

  const db = admin.firestore();
  const groupRef = db.collection("groups").doc(groupId);
  const userGroupRef = db.collection("users").doc(userId)
    .collection("groups").doc(groupId);
  const groupMemberRef = groupRef.collection("members").doc(userId);

  // Get current user membership data
  const [userGroupDoc] = await Promise.all([
    userGroupRef.get(),
    groupMemberRef.get(),
  ]);

  const userGroupData = userGroupDoc.data();

  // Create bucket documents
  const bucketIds: string[] = [];
  const bucketPromises: Promise<any>[] = [];

  for (let i = 0; i < bucketCount; i++) {
    const bucketRef = groupRef.collection("buckets").doc();
    bucketIds.push(bucketRef.id);

    const bucketData = {
      userId,
      unitsInBucket: unitsPerBucket,
      remainingUnits: unitsPerBucket,
      purchasedAt: new Date(),
      status: i === 0 ? "active" : "active", // All buckets start as active
      purchaseBatchId: `batch_${Date.now()}_${userId}`,
    };

    bucketPromises.push(bucketRef.set(bucketData));
  }

  // Set the first bucket as the active bucket if user has no active bucket
  const currentActiveBucketId = userGroupData?.activeBucketId;
  const newActiveBucketId = currentActiveBucketId || bucketIds[0];

  // Update user membership with new active bucket
  const updatePromises = [
    userGroupRef.update({
      activeBucketId: newActiveBucketId,
      updatedAt: new Date(),
    }),
    groupMemberRef.update({
      activeBucketId: newActiveBucketId,
      updatedAt: new Date(),
    }),
  ];

  // Execute all operations atomically
  await Promise.all([...bucketPromises, ...updatePromises]);

  return bucketIds;
}

/**
 * Updates a user's balance in a group
 *
 * This function allows admins to add debt (negative amount) or clear debt
 * (positive amount) for a user in a group. The balance can only be negative
 * (representing debt).
 *
 * @param {string} groupId - The ID of the group
 * @param {string} userId - The ID of the user whose balance to update
 * @param {number} amount - Amount to add to balance (negative for debt,
 * positive for payment)
 * @param {string} adminUserId - The ID of the admin making the change
 * @return {Promise<void>}
 *
 * @example
 * // Add $20 debt
 * await updateUserBalance("group123", "user456", -20, "admin789");
 *
 * // Clear $15 debt
 * await updateUserBalance("group123", "user456", 15, "admin789");
 *
 * @throws {Error} Various validation errors from validators
 */
export async function updateUserBalance(
  groupId: string,
  userId: string,
  amount: number,
  adminUserId: string
): Promise<void> {
  // Validate that user is a member of the group
  await validateUserGroupMembership(userId, groupId);

  // Validate that admin is a member and is admin
  await validateUserIsGroupAdmin(adminUserId, groupId);

  const db = admin.firestore();
  const userGroupRef = db.collection("users").doc(userId)
    .collection("groups").doc(groupId);
  const groupMemberRef = db.collection("groups").doc(groupId)
    .collection("members").doc(userId);

  // Get current user data
  const userGroupDoc = await userGroupRef.get();
  const userGroupData = userGroupDoc.data();

  // Validate amount is not zero
  if (amount === 0) {
    throw new Error("Amount cannot be zero");
  }

  const currentBalance = userGroupData?.balance || 0;
  const newBalance = currentBalance + amount;

  // Validate that balance doesn't become positive (users can only have debt)
  if (newBalance > 0) {
    throw new Error(
      "User balance cannot be positive. Maximum payment allowed: " +
      Math.abs(currentBalance)
    );
  }

  // Update user balance in both locations
  await Promise.all([
    userGroupRef.update({
      balance: newBalance,
      updatedAt: new Date(),
    }),
    groupMemberRef.update({
      balance: newBalance,
      updatedAt: new Date(),
    }),
  ]);
}

/**
 * Records consumption of units from a user's active bucket
 *
 * This function tracks when a user takes units from their active bucket.
 * If the active bucket runs out,
 * it automatically moves to the next available bucket.
 *
 * @param {string} groupId - The ID of the group
 * @param {string} userId - The ID of the user consuming units
 * @param {number} units - Number of units to consume
 * @return {Promise<void>}
 *
 * @example
 * await recordConsumption("group123", "user456", 2);
 * console.log("User consumed 2 units from their active bucket");
 *
 * @throws {Error} Various validation errors from validators
 */
export async function recordConsumption(
  groupId: string,
  userId: string,
  units: number
): Promise<void> {
  // Validate that user is a member of the group
  await validateUserGroupMembership(userId, groupId);

  const db = admin.firestore();
  const groupRef = db.collection("groups").doc(groupId);
  const userGroupRef = db.collection("users").doc(userId)
    .collection("groups").doc(groupId);
  const groupMemberRef = groupRef.collection("members").doc(userId);

  // Get current user membership data
  const [userGroupDoc] = await Promise.all([
    userGroupRef.get(),
    groupMemberRef.get(),
  ]);

  const userGroupData = userGroupDoc.data();
  const currentActiveBucketId = userGroupData?.activeBucketId;

  if (!currentActiveBucketId) {
    throw new Error("User has no active bucket");
  }

  // Get the active bucket
  const activeBucketRef = groupRef
    .collection("buckets")
    .doc(currentActiveBucketId);
  const activeBucketDoc = await activeBucketRef.get();

  if (!activeBucketDoc.exists) {
    throw new Error("Active bucket not found");
  }

  const activeBucketData = activeBucketDoc.data();
  const currentRemainingUnits = activeBucketData?.remainingUnits || 0;

  if (currentRemainingUnits < units) {
    throw new Error(
      `Insufficient units in active bucket.
      Available: ${currentRemainingUnits}, requested: ${units}`
    );
  }

  // Calculate new remaining units
  const newRemainingUnits = currentRemainingUnits - units;

  // Create consumption record
  const consumptionRef = groupRef.collection("consumption").doc();
  const consumptionData = {
    userId,
    units,
    consumedAt: new Date(),
    bucketId: currentActiveBucketId,
  };

  // Update bucket and create consumption record
  const updatePromises: Promise<any>[] = [
    consumptionRef.set(consumptionData),
  ];

  // If bucket is now empty, mark it as completed and find next bucket
  if (newRemainingUnits === 0) {
    // Mark current bucket as completed
    updatePromises.push(
      activeBucketRef.update({
        remainingUnits: 0,
        status: "completed",
        updatedAt: new Date(),
      })
    );

    // Find next available bucket
    const bucketsSnapshot = await groupRef
      .collection("buckets")
      .where("userId", "==", userId)
      .where("status", "==", "active")
      .orderBy("purchasedAt", "asc")
      .get();

    let nextActiveBucketId = null;
    for (const bucketDoc of bucketsSnapshot.docs) {
      const bucketData = bucketDoc.data();
      if (
        bucketDoc.id !== currentActiveBucketId &&
        bucketData.remainingUnits > 0
      ) {
        nextActiveBucketId = bucketDoc.id;
        break;
      }
    }

    // Update user's active bucket
    if (nextActiveBucketId) {
      updatePromises.push(
        userGroupRef.update({
          activeBucketId: nextActiveBucketId,
          updatedAt: new Date(),
        }),
        groupMemberRef.update({
          activeBucketId: nextActiveBucketId,
          updatedAt: new Date(),
        })
      );
    } else {
      // No more buckets available
      updatePromises.push(
        userGroupRef.update({
          activeBucketId: null,
          updatedAt: new Date(),
        }),
        groupMemberRef.update({
          activeBucketId: null,
          updatedAt: new Date(),
        })
      );
    }
  } else {
    // Just update the remaining units
    updatePromises.push(
      activeBucketRef.update({
        remainingUnits: newRemainingUnits,
        updatedAt: new Date(),
      })
    );
  }

  // Execute all operations atomically
  await Promise.all(updatePromises);
}

/**
 * Gets detailed information about a group including members
 * and bucket inventory
 *
 * @param {string} groupId - The ID of the group to get details for
 * @return {Promise<Object>} Group details including kitty balance and members
 *
 * @example
 * const groupDetails = await getGroupDetails("group123");
 * console.log("Group kitty balance:", groupDetails.kittyBalance);
 * console.log("Total members:", groupDetails.memberCount);
 */
export async function getGroupDetails(groupId: string): Promise<any> {
  const groupRef = await validateGroupExists(groupId);
  const groupDoc = await groupRef.get();
  const groupData = groupDoc.data();
  const kittyBalance = groupData?.kittyBalance || 0;

  // Get all members
  const membersSnapshot = await groupRef.collection("members").get();
  const members: any[] = [];

  membersSnapshot.forEach((doc) => {
    const memberData = doc.data();
    const member = {
      userId: doc.id,
      activeBucketId: memberData?.activeBucketId || null,
      balance: memberData?.balance || 0,
      joinedAt: memberData?.joinedAt,
      isAdmin: memberData?.isAdmin || false,
    };
    members.push(member);
  });

  // Get bucket inventory
  const bucketsSnapshot = await groupRef.collection("buckets").get();
  const buckets: any[] = [];

  bucketsSnapshot.forEach((doc) => {
    const bucketData = doc.data();
    const bucket = {
      bucketId: doc.id,
      userId: bucketData?.userId,
      unitsInBucket: bucketData?.unitsInBucket || 0,
      remainingUnits: bucketData?.remainingUnits || 0,
      status: bucketData?.status || "active",
      purchasedAt: bucketData?.purchasedAt,
      purchaseBatchId: bucketData?.purchaseBatchId,
    };
    buckets.push(bucket);
  });

  return {
    groupId,
    name: groupData?.name,
    kittyBalance,
    memberCount: members.length,
    members,
    buckets,
    createdAt: groupData?.createdAt,
    updatedAt: groupData?.updatedAt,
  };
}

/**
 * Gets all members of a group with their bucket information
 *
 * @param {string} groupId - The ID of the group to get members for
 * @return {Promise<Array>} Array of group members with their details
 *
 * @example
 * const members = await getGroupMembers("group123");
 * members.forEach(member => {
 *   console.log(`${member.userId}: active bucket ${member.activeBucketId}`);
 * });
 */
export async function getGroupMembers(groupId: string): Promise<any[]> {
  const groupRef = await validateGroupExists(groupId);

  // Get all members
  const membersSnapshot = await groupRef.collection("members").get();
  const members: any[] = [];

  membersSnapshot.forEach((doc) => {
    const memberData = doc.data();
    const member = {
      userId: doc.id,
      activeBucketId: memberData?.activeBucketId || null,
      balance: memberData?.balance || 0,
      joinedAt: memberData?.joinedAt,
      isAdmin: memberData?.isAdmin || false,
    };
    members.push(member);
  });

  return members;
}

/**
 * Gets detailed information about a user including their groups
 * and bucket status
 *
 * @param {string} userId - The ID of the user to get details for
 * @return {Promise<Object>} User details including groups
 * and bucket information
 *
 * @example
 * const userDetails = await getUserDetails("user123");
 * console.log("User groups:", userDetails.groups);
 * console.log("Total groups:", userDetails.groupCount);
 */
export async function getUserDetails(userId: string): Promise<any> {
  const userRef = await validateUserExists(userId);
  const userDoc = await userRef.get();

  const userData = userDoc.data();

  // Get all user's groups
  const groupsSnapshot = await userRef.collection("groups").get();
  const groups: any[] = [];

  groupsSnapshot.forEach((doc) => {
    const groupData = doc.data();
    const group = {
      groupId: doc.id,
      activeBucketId: groupData?.activeBucketId || null,
      balance: groupData?.balance || 0,
      joinedAt: groupData?.joinedAt,
      isAdmin: groupData?.isAdmin || false,
    };
    groups.push(group);
  });

  return {
    userId,
    displayName: userData?.displayName,
    email: userData?.email,
    groupCount: groups.length,
    groups,
    createdAt: userData?.createdAt,
    updatedAt: userData?.updatedAt,
  };
}

/**
 * Gets all buckets for a user in a specific group
 *
 * @param {string} groupId - The ID of the group
 * @param {string} userId - The ID of the user
 * @return {Promise<Array>} Array of buckets for the user in the group
 *
 * @example
 * const buckets = await getUserBuckets("group123", "user456");
 * buckets.forEach(bucket => {
 *   console.log(`Bucket ${bucket.bucketId}:
 *   ${bucket.remainingUnits}/${bucket.unitsInBucket} units remaining`);
 * });
 */
export async function getUserBuckets(
  groupId: string,
  userId: string
): Promise<any[]> {
  // Validate that user is a member of the group
  await validateUserGroupMembership(userId, groupId);

  const groupRef = await validateGroupExists(groupId);

  // Get all buckets for this user in this group
  const bucketsSnapshot = await groupRef
    .collection("buckets")
    .where("userId", "==", userId)
    .orderBy("purchasedAt", "asc")
    .get();

  const buckets: any[] = [];

  bucketsSnapshot.forEach((doc) => {
    const bucketData = doc.data();
    const bucket = {
      bucketId: doc.id,
      unitsInBucket: bucketData?.unitsInBucket || 0,
      remainingUnits: bucketData?.remainingUnits || 0,
      status: bucketData?.status || "active",
      purchasedAt: bucketData?.purchasedAt,
      purchaseBatchId: bucketData?.purchaseBatchId,
    };
    buckets.push(bucket);
  });

  return buckets;
}

/**
 * Gets consumption history for a group
 *
 * @param {string} groupId - The ID of the group
 * @return {Promise<Array>} Array of consumption records
 *
 * @example
 * const consumption = await getGroupConsumption("group123");
 * consumption.forEach(record => {
 *   console.log(`${record.userId} consumed ${record.units}
 *   units at ${record.consumedAt}`);
 * });
 */
export async function getGroupConsumption(groupId: string): Promise<any[]> {
  const groupRef = await validateGroupExists(groupId);

  // Get all consumption records
  const consumptionSnapshot = await groupRef
    .collection("consumption")
    .orderBy("consumedAt", "desc")
    .get();

  const consumption: any[] = [];

  consumptionSnapshot.forEach((doc) => {
    const consumptionData = doc.data();
    const record = {
      consumptionId: doc.id,
      userId: consumptionData?.userId,
      units: consumptionData?.units || 0,
      consumedAt: consumptionData?.consumedAt,
      bucketId: consumptionData?.bucketId,
    };
    consumption.push(record);
  });

  return consumption;
}

/**
 * Creates a transaction to add money to the group's kitty balance
 *
 * This function allows users to contribute money to the group's kitty.
 * It updates the group's kitty balance and creates a transaction record
 * for audit purposes.
 *
 * @param {string} groupId - The ID of the group
 * @param {string} userId - The ID of the user making the contribution
 * @param {number} amount - Amount to add to kitty balance (must be positive)
 * @param {string} comment - Optional description of the transaction
 * @return {Promise<string>} The ID of the created transaction
 *
 * @example
 * const transactionId = await createKittyTransaction(
 *   "group123", "user456", 50, "Weekly contribution"
 * );
 * console.log("Created transaction:", transactionId);
 *
 * @throws {Error} Various validation errors from validators
 */
export async function createKittyTransaction(
  groupId: string,
  userId: string,
  amount: number,
  comment?: string
): Promise<string> {
  // Validate that user is a member of the group
  await validateUserGroupMembership(userId, groupId);

  if (amount <= 0) {
    throw new Error("Transaction amount must be positive");
  }

  const groupRef = await validateGroupExists(groupId);
  const groupDoc = await groupRef.get();
  const groupData = groupDoc.data();
  const currentKittyBalance = groupData?.kittyBalance || 0;
  const newKittyBalance = currentKittyBalance + amount;

  // Create transaction document
  const transactionRef = groupRef.collection("transactions").doc();
  const transactionData = {
    userId,
    amount,
    type: "contribution",
    comment: comment || "",
    createdAt: new Date(),
  };

  // Update group kitty balance and create transaction record atomically
  await Promise.all([
    groupRef.update({
      kittyBalance: newKittyBalance,
      updatedAt: new Date(),
    }),
    transactionRef.set(transactionData),
  ]);

  return transactionRef.id;
}

/**
 * Gets transaction history for a group
 *
 * This function retrieves all transactions for a group, allowing admins
 * to see who has contributed to the kitty and when.
 *
 * @param {string} groupId - The ID of the group
 * @return {Promise<any[]>} Array of transaction records
 *
 * @example
 * const transactions = await getGroupTransactions("group123");
 * console.log("Transaction count:", transactions.length);
 */
export async function getGroupTransactions(groupId: string): Promise<any[]> {
  const groupRef = await validateGroupExists(groupId);

  // Get all transactions
  const transactionsSnapshot = await groupRef
    .collection("transactions")
    .orderBy("createdAt", "desc")
    .get();

  const transactions: any[] = [];

  transactionsSnapshot.forEach((doc) => {
    const transactionData = doc.data();
    const transaction = {
      transactionId: doc.id,
      userId: transactionData?.userId,
      amount: transactionData?.amount || 0,
      type: transactionData?.type || "contribution",
      comment: transactionData?.comment || "",
      createdAt: transactionData?.createdAt,
    };
    transactions.push(transaction);
  });

  return transactions;
}

/**
 * Creates a join request for a user to join a group
 *
 * This function allows users to request to join a group, which will
 * be reviewed by the group admin. The request is stored in a separate
 * collection and can be approved or denied by the admin.
 *
 * @param {string} groupId - The ID of the group
 * @param {string} userId - The ID of the user requesting to join
 * @param {string} message - Optional message from the user
 * @return {Promise<string>} The ID of the created join request
 *
 * @example
 * const requestId = await createJoinRequest(
 *   "group123",
 *   "user456",
 *   "New player wants to join team"
 * );
 * console.log("Created join request:", requestId);
 *
 * @throws {Error} Various validation errors from validators
 */
export async function createJoinRequest(
  groupId: string,
  userId: string,
  message?: string
): Promise<string> {
  const groupRef = await validateGroupExists(groupId);

  // Validate that user is not already a member (using existing validator)
  await validateUserNotInGroup(userId, groupId);

  // Check if user already has a pending request
  const existingRequestsSnapshot = await groupRef
    .collection("join_requests")
    .where("userId", "==", userId)
    .where("status", "==", "pending")
    .get();

  if (!existingRequestsSnapshot.empty) {
    throw new Error(
      "User already has a pending join request for this group"
    );
  }

  // Create join request document
  const joinRequestRef = groupRef.collection("join_requests").doc();
  const joinRequestData = {
    userId,
    message: message || "",
    status: "pending",
    createdAt: new Date(),
  };

  await joinRequestRef.set(joinRequestData);

  return joinRequestRef.id;
}

/**
 * Gets all join requests for a group
 *
 * This function retrieves all join requests for a group, allowing admins
 * to see pending requests and their details.
 *
 * @param {string} groupId - The ID of the group
 * @return {Promise<any[]>} Array of join request records
 *
 * @example
 * const requests = await getJoinRequests("group123");
 * console.log("Pending requests:", requests.length);
 */
export async function getJoinRequests(groupId: string): Promise<any[]> {
  const groupRef = await validateGroupExists(groupId);

  // Get all join requests
  const requestsSnapshot = await groupRef
    .collection("join_requests")
    .orderBy("createdAt", "desc")
    .get();

  const requests: any[] = [];

  requestsSnapshot.forEach((doc) => {
    const requestData = doc.data();
    const request = {
      requestId: doc.id,
      userId: requestData?.userId,
      message: requestData?.message || "",
      status: requestData?.status || "pending",
      createdAt: requestData?.createdAt,
      adminUserId: requestData?.adminUserId,
      processedAt: requestData?.processedAt,
      reason: requestData?.reason || "",
    };
    requests.push(request);
  });

  return requests;
}

/**
 * Approves a join request and adds the user to the group
 *
 * This function allows group admins to approve join requests.
 * When approved, the user is automatically added to the group.
 *
 * @param {string} groupId - The ID of the group
 * @param {string} requestId - The ID of the join request
 * @param {string} adminUserId - The ID of the admin approving the request
 * @param {string} reason - Optional reason/message from admin
 * @return {Promise<void>}
 *
 * @example
 * await approveJoinRequest(
 *   "group123",
 *   "request456",
 *   "admin789",
 *   "Welcome to the team!"
 * );
 *
 * @throws {Error} Various validation errors from validators
 */
export async function approveJoinRequest(
  groupId: string,
  requestId: string,
  adminUserId: string,
  reason?: string
): Promise<void> {
  const groupRef = await validateGroupExists(groupId);
  const joinRequestRef = groupRef.collection("join_requests").doc(requestId);

  // Verify join request exists
  const requestDoc = await joinRequestRef.get();
  if (!requestDoc.exists) {
    throw new Error("Join request not found");
  }

  const requestData = requestDoc.data();
  if (requestData?.status !== "pending") {
    throw new Error("Join request is not pending");
  }

  // Verify admin is actually an admin of the group
  await validateUserIsGroupAdmin(adminUserId, groupId);

  const userId = requestData.userId;

  // Update join request status
  await joinRequestRef.update({
    status: "approved",
    adminUserId,
    processedAt: new Date(),
    reason: reason || "Approved by admin",
  });

  // Add user to group
  await addUserToGroup(userId, groupId, false);
}

/**
 * Denies a join request
 *
 * This function allows group admins to deny join requests.
 * The request is marked as denied but the user is not added to the group.
 *
 * @param {string} groupId - The ID of the group
 * @param {string} requestId - The ID of the join request
 * @param {string} adminUserId - The ID of the admin denying the request
 * @param {string} reason - Reason for denial
 * @return {Promise<void>}
 *
 * @example
 * await denyJoinRequest("group123", "request456", "admin789", "Team is full");
 *
 * @throws {Error} Various validation errors from validators
 */
export async function denyJoinRequest(
  groupId: string,
  requestId: string,
  adminUserId: string,
  reason: string
): Promise<void> {
  const groupRef = await validateGroupExists(groupId);
  const joinRequestRef = groupRef.collection("join_requests").doc(requestId);

  // Verify join request exists
  const requestDoc = await joinRequestRef.get();
  if (!requestDoc.exists) {
    throw new Error("Join request not found");
  }

  const requestData = requestDoc.data();
  if (requestData?.status !== "pending") {
    throw new Error("Join request is not pending");
  }

  // Verify admin is actually an admin of the group
  await validateUserIsGroupAdmin(adminUserId, groupId);

  // Update join request status
  await joinRequestRef.update({
    status: "denied",
    adminUserId,
    processedAt: new Date(),
    reason: reason,
  });
}

/**
 * Generates a QR code for a group
 *
 * This function creates a QR code that can be used for both onboarding
 * and consumption tracking. The QR code contains group information
 * and appropriate URLs for different platforms.
 *
 * @param {string} groupId - The ID of the group
 * @param {string} type - The type of QR code (dual-purpose,
 * onboarding, consumption)
 * @param {number} size - The size of the QR code in pixels
 * @param {boolean} includeLogo - Whether to include a logo in the QR code
 * @return {Promise<{
 *   qrCodeDataUrl: string,
 *   qrCodeContent: string,
 *   groupInfo: any
 * }>}
 *
 * @example
 * const { qrCodeDataUrl, qrCodeContent, groupInfo } = await generateQRCode(
 *   "group123",
 *   "dual-purpose",
 *   300,
 *   false
 * );
 *
 * @throws {Error} If group doesn't exist
 */
export async function generateQRCode(
  groupId: string,
  type: "dual-purpose" | "onboarding" | "consumption" = "dual-purpose",
  size = 300,
  includeLogo = false
): Promise<{
  qrCodeDataUrl: string;
  qrCodeContent: string;
  groupInfo: any;
}> {
  // Validate group exists
  const groupRef = await validateGroupExists(groupId);
  const groupDoc = await groupRef.get();
  const groupData = groupDoc.data();

  if (!groupData) {
    throw new Error("Group not found");
  }

  // Create QR code data structure
  const qrData = {
    type: type,
    groupId: groupId,
    version: "1.0",
    timestamp: Date.now(),
    urls: {
      ios: "https://apps.apple.com/app/kitty-fb/id123456789", // Placeholder
      android:
        "https://play.google.com/store/apps/details?id=com.kittyfb.app", // Placeholder
      web: `https://kitty-fb.web.app/group/${groupId}`,
    },
  };

  const qrContent = JSON.stringify(qrData);

  // Generate QR code as data URL
  const qrCodeDataUrl = await QRCode.toDataURL(qrContent, {
    width: size,
    margin: 2,
    color: {
      dark: "#000000",
      light: "#FFFFFF",
    },
    errorCorrectionLevel: "H", // High error correction for better scanning
  });

  return {
    qrCodeDataUrl,
    qrCodeContent: qrContent,
    groupInfo: {
      id: groupId,
      name: groupData.name,
      memberCount: groupData.memberCount || 0,
      kittyBalance: groupData.kittyBalance || 0,
    },
  };
}


/**
 * @typedef {Object} ProcessQRCodeResult
 * @property {string} action - Action to take
 * @property {string} groupId - The group ID
 * @property {any} groupInfo - Group information
 * @property {any} [userInfo] - Optional user info
 */

/**
 * Processes a scanned QR code and determines the appropriate action
 *
 * This function analyzes the QR code data and user context to determine
 * whether the user should be onboarded, join the group, or consume units.
 *
 * @param {string} qrData - The QR code data (JSON string)
 * @param {any} userContext - User context information
 * @return {Promise<ProcessQRCodeResult>}
 *
 * @example
 * const result = await processQRCode(
 *   '{"type":"dual-purpose","groupId":"group123"}',
 *   { userId: "user123", platform: "ios" }
 * );
 *
 * @throws {Error} If QR data is invalid or group doesn't exist
 */
export async function processQRCode(
  qrData: string,
  userContext: {
    userId?: string;
    platform: "ios" | "android" | "web";
    appVersion?: string;
    deviceId?: string;
  }
): Promise<{
  action: string;
  groupId: string;
  groupInfo: any;
  userInfo?: any;
}> {
  try {
    // Parse QR code data
    const parsedData = JSON.parse(qrData);

    if (!parsedData.groupId) {
      throw new Error("Invalid QR code: missing group ID");
    }

    const groupId = parsedData.groupId;

    // Validate group exists
    const groupRef = await validateGroupExists(groupId);
    const groupDoc = await groupRef.get();
    const groupData = groupDoc.data();

    if (!groupData) {
      throw new Error("Group not found");
    }

    // If no user ID provided, it's an onboarding flow
    if (!userContext.userId) {
      return {
        action: "onboarding",
        groupId: groupId,
        groupInfo: {
          id: groupId,
          name: groupData.name,
          memberCount: groupData.memberCount || 0,
        },
      };
    }

    // Check if user is a member of the group
    try {
      const {groupMemberRef} = await validateUserGroupMembership(
        userContext.userId,
        groupId
      );
      const memberData = (await groupMemberRef.get()).data();

      if (memberData) {
        // User is a member - check if they can consume
        const userBuckets = await getUserBuckets(groupId, userContext.userId);
        const activeBucket = userBuckets.find((bucket) =>
          bucket.status === "active");

        return {
          action: "consumption",
          groupId: groupId,
          groupInfo: {
            id: groupId,
            name: groupData.name,
            memberCount: groupData.memberCount || 0,
          },
          userInfo: {
            isMember: true,
            isAdmin: memberData.isAdmin || false,
            activeBucketId: memberData.activeBucketId || null,
            remainingUnits: activeBucket ? activeBucket.remainingUnits : 0,
            hasActiveBucket: !!activeBucket,
          },
        };
      }
    } catch (error) {
      // User is not a member - join request flow
      return {
        action: "join-request",
        groupId: groupId,
        groupInfo: {
          id: groupId,
          name: groupData.name,
          memberCount: groupData.memberCount || 0,
        },
        userInfo: {
          isMember: false,
          isAdmin: false,
          activeBucketId: null,
          remainingUnits: 0,
          hasActiveBucket: false,
        },
      };
    }

    // Fallback to onboarding
    return {
      action: "onboarding",
      groupId: groupId,
      groupInfo: {
        id: groupId,
        name: groupData.name,
        memberCount: groupData.memberCount || 0,
      },
    };
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error("Invalid QR code format");
    }
    throw error;
  }
}
