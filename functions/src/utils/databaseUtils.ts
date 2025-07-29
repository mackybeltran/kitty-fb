import * as admin from "firebase-admin";

/**
 * DATABASE UTILITIES
 *
 * This module provides utilities for managing the database during development,
 * including wiping all data and seeding with test data.
 *
 * WARNING: These functions should only be used in
 * development/testing environments.
 * They will permanently delete all data in the specified collections.
 *
 * SECURITY: These utilities are only available when NODE_ENV=development
 * or when ENABLE_DEV_UTILITIES=true is set.
 */

/**
 * Checks if development utilities are enabled
 *
 * @return {boolean} True if dev utilities should be available
 */
function isDevUtilitiesEnabled(): boolean {
  const nodeEnv = process.env.NODE_ENV;
  const enableDevUtilities = process.env.ENABLE_DEV_UTILITIES;

  // Allow if explicitly enabled or in development environment
  return nodeEnv === "development" || enableDevUtilities === "true";
}

/**
 * Throws an error if dev utilities are not enabled
 *
 * @throws {Error} If dev utilities are disabled
 */
function requireDevUtilities(): void {
  if (!isDevUtilitiesEnabled()) {
    throw new Error(
      "Development utilities are disabled in production. " +
      "Set NODE_ENV=development or ENABLE_DEV_UTILITIES=true to enable."
    );
  }
}

/**
 * Wipes all data from the database collections
 *
 * @param {string[]} collections - Array of collection names to wipe
 * @return {Promise<void>}
 *
 * @example
 * await wipeDatabase(['users', 'groups']);
 */
export async function wipeDatabase(
  collections: string[] = ["users", "groups"]
): Promise<void> {
  requireDevUtilities();

  const db = admin.firestore();
  let totalDeleted = 0;

  console.log(
    `Starting database wipe for collections: ${collections.join(", ")}`
  );

  for (const collectionName of collections) {
    console.log(`Wiping collection: ${collectionName}`);

    // Get all documents in the collection
    const snapshot = await db.collection(collectionName).get();

    if (snapshot.empty) {
      console.log(`Collection ${collectionName} is already empty`);
      continue;
    }

    // Delete all documents in batches
    const deletePromises: Promise<void>[] = [];

    snapshot.docs.forEach((doc) => {
      const deletePromise = deleteDocumentAndSubcollections(doc.ref);
      deletePromises.push(deletePromise);
    });

    await Promise.all(deletePromises);
    totalDeleted += snapshot.docs.length;
    console.log(
      `Deleted ${snapshot.docs.length} documents from ${collectionName}`
    );
  }

  console.log(
    `Database wipe complete. Total documents deleted: ${totalDeleted}`
  );
}

/**
 * Recursively deletes a document and all its subcollections
 *
 * @param {admin.firestore.DocumentReference}
 * docRef - Document reference to delete
 * @return {Promise<void>}
 */
async function deleteDocumentAndSubcollections(
  docRef: admin.firestore.DocumentReference
): Promise<void> {
  // Get all subcollections
  const collections = await docRef.listCollections();

  // Delete all documents in subcollections
  for (const collection of collections) {
    const snapshot = await collection.get();

    for (const doc of snapshot.docs) {
      await deleteDocumentAndSubcollections(doc.ref);
    }
  }

  // Delete the document itself
  await docRef.delete();
}

/**
 * Seeds the database with test data
 *
 * @param {Object} options - Seeding options
 * @param {number} options.userCount - Number of test users to create
 * @param {number} options.groupCount - Number of test groups to create
 * @param {number} options.maxUsersPerGroup - Maximum users per group
 * @return {Promise<Object>} Created test data
 *
 * @example
 * const testData = await seedDatabase({
 *   userCount: 5,
 *   groupCount: 3,
 *   maxUsersPerGroup: 4
 * });
 */
export async function seedDatabase(
  options: {
    userCount?: number;
    groupCount?: number;
    maxUsersPerGroup?: number;
  } = {}
): Promise<any> {
  requireDevUtilities();

  const {
    userCount = 5,
    groupCount = 3,
    maxUsersPerGroup = 4,
  } = options;

  const db = admin.firestore();
  const createdData = {
    users: [] as any[],
    groups: [] as any[],
    memberships: [] as any[],
    buckets: [] as any[],
  };

  console.log(`Seeding database with ${userCount} users, ${groupCount} groups`);

  // Create test users
  for (let i = 1; i <= userCount; i++) {
    const userData = {
      displayName: `Test User ${i}`,
      email: `testuser${i}@example.com`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const userRef = db.collection("users").doc();
    await userRef.set(userData);

    createdData.users.push({
      id: userRef.id,
      ...userData,
    });

    console.log(`Created user: ${userData.displayName} (${userRef.id})`);
  }

  // Create test groups
  for (let i = 1; i <= groupCount; i++) {
    const groupData = {
      name: `Test Group ${i}`,
      kittyBalance: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const groupRef = db.collection("groups").doc();
    await groupRef.set(groupData);

    createdData.groups.push({
      id: groupRef.id,
      ...groupData,
    });

    console.log(`Created group: ${groupData.name} (${groupRef.id})`);
  }

  // Add users to groups randomly
  for (const group of createdData.groups) {
    const groupRef = db.collection("groups").doc(group.id);
    const usersInGroup = Math.floor(Math.random() * maxUsersPerGroup) + 1;
    const selectedUsers = createdData.users
      .sort(() => 0.5 - Math.random())
      .slice(0, usersInGroup);

    for (let i = 0; i < selectedUsers.length; i++) {
      const user = selectedUsers[i];
      const userRef = db.collection("users").doc(user.id);
      const joinedAt = new Date();

      // First user is always admin, others are never admin
      const isAdmin = i === 0;

      // Add user to group's members subcollection
      await groupRef.collection("members").doc(user.id).set({
        activeBucketId: null, // No active bucket initially
        balance: 0, // Initial balance starts at 0 (no debt)
        isAdmin,
        joinedAt,
        updatedAt: new Date(),
      });

      // Add group to user's groups subcollection
      await userRef.collection("groups").doc(group.id).set({
        activeBucketId: null, // No active bucket initially
        balance: 0, // Initial balance starts at 0 (no debt)
        isAdmin,
        joinedAt,
        updatedAt: new Date(),
      });

      createdData.memberships.push({
        userId: user.id,
        groupId: group.id,
        joinedAt,
        isAdmin,
      });

      const adminText = isAdmin ? " (admin)" : "";
      console.log(
        `Added ${user.displayName} to ${group.name}${adminText}`
      );

      // Add some test buckets for each user
      const bucketCount = Math.floor(Math.random() * 3) + 1; // 1-3 buckets
      const unitsPerBucket = Math.floor(Math.random() * 10) + 5;
      // 5-14 units per bucket

      for (let j = 0; j < bucketCount; j++) {
        const bucketRef = groupRef.collection("buckets").doc();
        const bucketData = {
          userId: user.id,
          unitsInBucket: unitsPerBucket,
          remainingUnits: unitsPerBucket,
          purchasedAt: new Date(),
          status: "active",
          purchaseBatchId: `batch_${Date.now()}_${user.id}_${j}`,
        };

        await bucketRef.set(bucketData);

        createdData.buckets.push({
          id: bucketRef.id,
          groupId: group.id, // Track which group this bucket belongs to
          ...bucketData,
        });

        console.log(
          `Created bucket ${bucketRef.id} for ${user.displayName} in ` +
          `${group.name}: ${unitsPerBucket} units`
        );
      }

      // Set the first bucket as active for this user
      if (createdData.buckets.length > 0) {
        const firstBucket = createdData.buckets.find(
          (b) => b.userId === user.id &&
            b.groupId === group.id
        );
        if (firstBucket) {
          await groupRef.collection("members").doc(user.id).update({
            activeBucketId: firstBucket.id,
          });
          await userRef.collection("groups").doc(group.id).update({
            activeBucketId: firstBucket.id,
          });
        }
      }
    }
  }

  console.log("Database seeding complete!");
  console.log(
    `Created ${createdData.users.length} users, ` +
    `${createdData.groups.length} groups, ` +
    `${createdData.memberships.length} memberships, ` +
    `${createdData.buckets.length} buckets`
  );

  return createdData;
}

/**
 * Resets the database to a clean state with test data
 *
 * @param {Object} options - Options for reset
 * @param {string[]} options.collections - Collections to wipe
 * @param {Object} options.seedOptions - Options for seeding
 * @return {Promise<Object>} Created test data
 *
 * @example
 * const testData = await resetDatabase({
 *   collections: ['users', 'groups'],
 *   seedOptions: { userCount: 3, groupCount: 2 }
 * });
 */
export async function resetDatabase(
  options: {
    collections?: string[];
    seedOptions?: {
      userCount?: number;
      groupCount?: number;
      maxUsersPerGroup?: number;
    };
  } = {}
): Promise<any> {
  requireDevUtilities();

  const {collections = ["users", "groups"], seedOptions = {}} = options;

  console.log("Starting database reset...");

  // Wipe the database
  await wipeDatabase(collections);

  // Seed with test data
  const testData = await seedDatabase(seedOptions);

  console.log("Database reset complete!");

  return testData;
}

/**
 * Gets database statistics
 *
 * @return {Promise<Object>} Database statistics
 *
 * @example
 * const stats = await getDatabaseStats();
 * console.log(`Total users: ${stats.userCount}`);
 */
export async function getDatabaseStats(): Promise<any> {
  const db = admin.firestore();

  // Count users
  const usersSnapshot = await db.collection("users").get();
  const userCount = usersSnapshot.size;

  // Count groups
  const groupsSnapshot = await db.collection("groups").get();
  const groupCount = groupsSnapshot.size;

  // Count total memberships
  let totalMemberships = 0;
  for (const groupDoc of groupsSnapshot.docs) {
    const membersSnapshot = await groupDoc.ref.collection("members").get();
    totalMemberships += membersSnapshot.size;
  }

  // Count total buckets
  let totalBuckets = 0;
  let totalUnits = 0;
  let totalRemainingUnits = 0;

  for (const groupDoc of groupsSnapshot.docs) {
    const bucketsSnapshot = await groupDoc.ref.collection("buckets").get();
    totalBuckets += bucketsSnapshot.size;

    bucketsSnapshot.forEach((bucketDoc) => {
      const bucketData = bucketDoc.data();
      totalUnits += bucketData?.unitsInBucket || 0;
      totalRemainingUnits += bucketData?.remainingUnits || 0;
    });
  }

  // Count total consumption
  let totalConsumption = 0;
  for (const groupDoc of groupsSnapshot.docs) {
    const consumptionSnapshot = await groupDoc.ref
      .collection("consumption")
      .get();
    consumptionSnapshot.forEach((consumptionDoc) => {
      const consumptionData = consumptionDoc.data();
      totalConsumption += consumptionData?.units || 0;
    });
  }

  // Count total transactions
  let totalTransactions = 0;
  let totalTransactionAmount = 0;
  for (const groupDoc of groupsSnapshot.docs) {
    const transactionsSnapshot = await groupDoc.ref
      .collection("transactions")
      .get();
    totalTransactions += transactionsSnapshot.size;
    transactionsSnapshot.forEach((transactionDoc) => {
      const transactionData = transactionDoc.data();
      totalTransactionAmount += transactionData?.amount || 0;
    });
  }

  // Calculate total kitty balance
  let totalKittyBalance = 0;
  for (const groupDoc of groupsSnapshot.docs) {
    const groupData = groupDoc.data();
    totalKittyBalance += groupData?.kittyBalance || 0;
  }

  return {
    userCount,
    groupCount,
    totalMemberships,
    totalBuckets,
    totalUnits,
    totalRemainingUnits,
    totalConsumption,
    totalTransactions,
    totalTransactionAmount,
    totalKittyBalance,
    averageUsersPerGroup: groupCount > 0 ? totalMemberships / groupCount : 0,
    averageBucketsPerGroup: groupCount > 0 ? totalBuckets / groupCount : 0,
  };
}

/**
 * Checks if development utilities are available
 *
 * @return {boolean} True if dev utilities are enabled
 *
 * @example
 * const isDev = isDevUtilitiesAvailable();
 * console.log("Dev utilities available:", isDev);
 */
export function isDevUtilitiesAvailable(): boolean {
  return isDevUtilitiesEnabled();
}
