import {
  testEnv,
  createTestUser,
  createTestGroup,
  cleanupTestData,
  admin,
} from "../setup/unit-setup";
import {
  wipeDatabase,
  seedDatabase,
  resetDatabase,
  getDatabaseStats,
  isDevUtilitiesAvailable,
} from "../../utils/databaseUtils";

describe("Database Utils (Unit Tests)", () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalEnableDevUtilities = process.env.ENABLE_DEV_UTILITIES;

  beforeAll(() => {
    // Enable dev utilities for these tests
    process.env.NODE_ENV = "development";
    process.env.ENABLE_DEV_UTILITIES = "true";
  });

  afterAll(() => {
    // Restore original environment
    process.env.NODE_ENV = originalNodeEnv;
    process.env.ENABLE_DEV_UTILITIES = originalEnableDevUtilities;
    testEnv.cleanup();
  });

  beforeEach(async () => {
    await cleanupTestData();
  });

  describe("isDevUtilitiesAvailable", () => {
    it("should return true when NODE_ENV is development", () => {
      process.env.NODE_ENV = "development";
      process.env.ENABLE_DEV_UTILITIES = undefined;

      expect(isDevUtilitiesAvailable()).toBe(true);
    });

    it("should return true when ENABLE_DEV_UTILITIES is true", () => {
      process.env.NODE_ENV = "production";
      process.env.ENABLE_DEV_UTILITIES = "true";

      expect(isDevUtilitiesAvailable()).toBe(true);
    });

    it("should return true when in Jest environment", () => {
      // In Jest environment, dev utilities should always be available
      expect(isDevUtilitiesAvailable()).toBe(true);
    });
  });

  describe("wipeDatabase", () => {
    beforeEach(async () => {
      // Create some test data
      await createTestUser();
      await createTestGroup();
    });

    it("should wipe all collections by default", async () => {
      // Verify data exists
      const db = admin.firestore();
      const usersSnapshot = await db.collection("users").get();
      const groupsSnapshot = await db.collection("groups").get();

      expect(usersSnapshot.size).toBeGreaterThan(0);
      expect(groupsSnapshot.size).toBeGreaterThan(0);

      // Wipe database
      await wipeDatabase();

      // Small delay to ensure operations complete
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Verify data is gone (allow for some delay in cleanup)
      const usersAfterSnapshot = await db.collection("users").get();
      const groupsAfterSnapshot = await db.collection("groups").get();

      expect(usersAfterSnapshot.size).toBe(0);
      expect(groupsAfterSnapshot.size).toBe(0);
    });

    it("should wipe specific collections only", async () => {
      // Create data in both collections
      await createTestUser();
      await createTestGroup();

      const db = admin.firestore();

      // Wipe only users
      await wipeDatabase(["users"]);

      // Verify only users are wiped
      const usersSnapshot = await db.collection("users").get();
      const groupsSnapshot = await db.collection("groups").get();

      expect(usersSnapshot.size).toBe(0);
      expect(groupsSnapshot.size).toBeGreaterThan(0);
    });

    it("should handle empty collections gracefully", async () => {
      // First ensure we have a clean state
      await wipeDatabase();
      
      // Small delay to ensure cleanup
      await new Promise(resolve => setTimeout(resolve, 1000));

      const db = admin.firestore();
      const usersSnapshot = await db.collection("users").get();
      const groupsSnapshot = await db.collection("groups").get();

      expect(usersSnapshot.size).toBe(0);
      expect(groupsSnapshot.size).toBe(0);

      // Should not throw error
      await expect(wipeDatabase()).resolves.not.toThrow();
    });
  });

  describe("seedDatabase", () => {
    it("should seed database with default options", async () => {
      const result = await seedDatabase();

      expect(result).toBeDefined();
      expect(result.users).toBeDefined();
      expect(result.groups).toBeDefined();
      expect(result.memberships).toBeDefined();
      expect(result.buckets).toBeDefined();

      // Verify data was created
      const db = admin.firestore();
      const usersSnapshot = await db.collection("users").get();
      const groupsSnapshot = await db.collection("groups").get();

      expect(usersSnapshot.size).toBeGreaterThan(0);
      expect(groupsSnapshot.size).toBeGreaterThan(0);
    }, 15000);

    it("should seed database with custom options", async () => {
      const options = {
        userCount: 3,
        groupCount: 2,
        maxUsersPerGroup: 2,
      };

      const result = await seedDatabase(options);

      expect(result.users.length).toBe(3);
      expect(result.groups.length).toBe(2);
      expect(result.memberships.length).toBeLessThanOrEqual(6);
      // 3 users * 2 groups
    });

    it("should create users with valid data", async () => {
      const result = await seedDatabase({userCount: 2});

      expect(result.users.length).toBe(2);

      // Verify user data structure
      for (const user of result.users) {
        expect(user.displayName).toBeDefined();
        expect(user.email).toBeDefined();
        expect(user.createdAt).toBeDefined();
      }
    });

    it("should create groups with valid data", async () => {
      const result = await seedDatabase({groupCount: 2});

      expect(result.groups.length).toBe(2);

      // Verify group data structure
      for (const group of result.groups) {
        expect(group.name).toBeDefined();
        expect(group.kittyBalance).toBe(0);
        expect(group.createdAt).toBeDefined();
      }
    });

    it("should create user-group relationships", async () => {
      const result = await seedDatabase({
        userCount: 2,
        groupCount: 1,
        maxUsersPerGroup: 2,
      });

      expect(result.memberships.length).toBeGreaterThan(0);

      // Verify user-group data structure
      for (const userGroup of result.memberships) {
        expect(userGroup.userId).toBeDefined();
        expect(userGroup.groupId).toBeDefined();
        expect(userGroup.isAdmin).toBeDefined();
        expect(userGroup.joinedAt).toBeDefined();
      }
    });
  });

  describe("resetDatabase", () => {
    beforeEach(async () => {
      // Create some existing data
      await createTestUser();
      await createTestGroup();
    });

    it("should reset database with default options", async () => {
      const result = await resetDatabase();

      expect(result).toBeDefined();
      expect(result.users).toBeDefined();
      expect(result.groups).toBeDefined();

      // Verify database was reset and seeded
      const db = admin.firestore();
      const usersSnapshot = await db.collection("users").get();
      const groupsSnapshot = await db.collection("groups").get();

      expect(usersSnapshot.size).toBeGreaterThan(0);
      expect(groupsSnapshot.size).toBeGreaterThan(0);
    });

    it("should reset database with custom options", async () => {
      const options = {
        collections: ["users"],
        seedOptions: {
          userCount: 1,
          groupCount: 1,
        },
      };

      const result = await resetDatabase(options);

      expect(result.users.length).toBe(1);
      expect(result.groups.length).toBe(1);
    });

    it("should handle reset with no seeding", async () => {
      const options = {
        collections: ["users", "groups"],
        seedOptions: {
          userCount: 0,
          groupCount: 0,
        },
      };

      const result = await resetDatabase(options);

      expect(result.users.length).toBe(0);
      expect(result.groups.length).toBe(0);
    });
  });

  describe("getDatabaseStats", () => {
    it("should return stats for empty database", async () => {
      const stats = await getDatabaseStats();

      expect(stats).toBeDefined();
      expect(stats.userCount).toBe(0);
      expect(stats.groupCount).toBe(0);
      expect(stats.totalMemberships).toBe(0);
      expect(stats.totalBuckets).toBe(0);
      expect(stats.totalTransactions).toBe(0);
      expect(stats.totalConsumption).toBe(0);
    });

    it("should return stats for populated database", async () => {
      // Seed some data
      await seedDatabase({userCount: 2, groupCount: 1});

      const stats = await getDatabaseStats();

      expect(stats.userCount).toBe(2);
      expect(stats.groupCount).toBe(1);
      expect(stats.totalMemberships).toBeGreaterThan(0);
      expect(stats.totalBuckets).toBeGreaterThan(0); // Buckets are created by default
      expect(stats.totalTransactions).toBe(0); // No transactions by default
      expect(stats.totalConsumption).toBe(0); // No consumption by default
      // Note: joinRequests is not tracked in getDatabaseStats
    });

    it("should count all collection types", async () => {
      // Create a user and group
      const userId = await createTestUser();
      const groupId = await createTestGroup();

      // Add user to group (both directions as per the data model)
      const db = admin.firestore();
      await db.collection("users").doc(userId)
        .collection("groups").doc(groupId).set({
          balance: 0,
          joinedAt: admin.firestore.FieldValue.serverTimestamp(),
          isAdmin: false,
        });
      
      // Also add to group's members subcollection
      await db.collection("groups").doc(groupId)
        .collection("members").doc(userId).set({
          balance: 0,
          joinedAt: admin.firestore.FieldValue.serverTimestamp(),
          isAdmin: false,
        });

      const stats = await getDatabaseStats();

      expect(stats.userCount).toBe(1);
      expect(stats.groupCount).toBe(1);
      expect(stats.totalMemberships).toBeGreaterThan(0);
    });
  });
});
