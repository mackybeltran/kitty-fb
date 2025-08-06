import {
  testEnv,
  createTestUser,
  createTestGroup,
  cleanupTestData,
  admin,
} from "../setup/unit-setup";
import {
  createUser,
  createGroup,
  addUserToGroup,
  getGroupDetails,
  getUserDetails,
  getGroupMembers,
  getUserBuckets,
  getGroupConsumption,
  createKittyTransaction,
  getGroupTransactions,
} from "../../services/firestore";

describe("Firestore Service (Unit Tests)", () => {
  let testUserId: string;
  let testGroupId: string;

  beforeEach(async () => {
    await cleanupTestData();
    testUserId = await createTestUser();
    testGroupId = await createTestGroup();
  });

  afterAll(async () => {
    await cleanupTestData();
    testEnv.cleanup();
  });

  describe("createUser", () => {
    it("should create a new user with valid data", async () => {
      const displayName = "John Doe";
      const email = "john@example.com";

      const userId = await createUser(displayName, email);

      expect(userId).toBeDefined();
      expect(typeof userId).toBe("string");
      expect(userId.length).toBeGreaterThan(0);

      // Verify user was created in database
      const db = admin.firestore();
      const userDoc = await db.collection("users").doc(userId).get();

      expect(userDoc.exists).toBe(true);
      expect(userDoc.data()?.displayName).toBe(displayName);
      expect(userDoc.data()?.email).toBe(email);
      expect(userDoc.data()?.createdAt).toBeDefined();
    });

    it("should create users with different data", async () => {
      const user1Id = await createUser("Alice Smith", "alice@example.com");
      const user2Id = await createUser("Bob Johnson", "bob@example.com");

      expect(user1Id).not.toBe(user2Id);

      const db = admin.firestore();
      const user1Doc = await db.collection("users").doc(user1Id).get();
      const user2Doc = await db.collection("users").doc(user2Id).get();

      expect(user1Doc.data()?.displayName).toBe("Alice Smith");
      expect(user2Doc.data()?.displayName).toBe("Bob Johnson");
    });
  });

  describe("createGroup", () => {
    it("should create a new group with valid data", async () => {
      const groupName = "Weekend Trip";

      const groupId = await createGroup(groupName);

      expect(groupId).toBeDefined();
      expect(typeof groupId).toBe("string");
      expect(groupId.length).toBeGreaterThan(0);

      // Verify group was created in database
      const db = admin.firestore();
      const groupDoc = await db.collection("groups").doc(groupId).get();

      expect(groupDoc.exists).toBe(true);
      expect(groupDoc.data()?.name).toBe(groupName);
      expect(groupDoc.data()?.kittyBalance).toBe(0);
      expect(groupDoc.data()?.createdAt).toBeDefined();
    });

    it("should create groups with different names",
      async () => {
        const group1Id = await createGroup("Summer Vacation");
        const group2Id = await createGroup("Office Lunch");

        expect(group1Id).not.toBe(group2Id);

        const db = admin.firestore();
        const group1Doc = await db.collection("groups").doc(group1Id).get();
        const group2Doc = await db.collection("groups").doc(group2Id).get();

        expect(group1Doc.data()?.name).toBe("Summer Vacation");
        expect(group2Doc.data()?.name).toBe("Office Lunch");
      });
  });

  describe("addUserToGroup", () => {
    it("should add user to group with default admin status",
      async () => {
        await addUserToGroup(testUserId, testGroupId);

        const db = admin.firestore();

        // Check user's groups subcollection
        const userGroupDoc = await db
          .collection("users").doc(testUserId)
          .collection("groups").doc(testGroupId).get();

        expect(userGroupDoc.exists).toBe(true);
        expect(userGroupDoc.data()?.balance).toBe(0);
        expect(userGroupDoc.data()?.isAdmin).toBe(true); // First user is admin
        expect(userGroupDoc.data()?.joinedAt).toBeDefined();

        // Check group's members subcollection
        const groupMemberDoc = await db
          .collection("groups").doc(testGroupId)
          .collection("members").doc(testUserId).get();

        expect(groupMemberDoc.exists).toBe(true);
        expect(groupMemberDoc.data()?.balance).toBe(0);
        expect(groupMemberDoc.data()?.isAdmin).toBe(true);
        // First user is admin
        expect(groupMemberDoc.data()?.joinedAt).toBeDefined();
      });

    it("should add user to group as admin", async () => {
      await addUserToGroup(testUserId, testGroupId, true);

      const db = admin.firestore();

      // Check user's groups subcollection
      const userGroupDoc = await db
        .collection("users").doc(testUserId)
        .collection("groups").doc(testGroupId).get();

      expect(userGroupDoc.data()?.isAdmin).toBe(true);

      // Check group's members subcollection
      const groupMemberDoc = await db
        .collection("groups").doc(testGroupId)
        .collection("members").doc(testUserId).get();

      expect(groupMemberDoc.data()?.isAdmin).toBe(true);
    });
  });

  describe("getGroupDetails", () => {
    beforeEach(async () => {
      await addUserToGroup(testUserId, testGroupId);
    });

    it("should return group details with member count", async () => {
      const groupDetails = await getGroupDetails(testGroupId);

      expect(groupDetails).toBeDefined();
      expect(groupDetails.groupId).toBe(testGroupId);
      expect(groupDetails.name).toBe("Test Group");
      expect(groupDetails.kittyBalance).toBe(0);
      expect(groupDetails.memberCount).toBe(1);
      expect(groupDetails.members).toBeDefined();
      expect(Array.isArray(groupDetails.members)).toBe(true);
      expect(groupDetails.members.length).toBe(1);
    });

    it("should return empty members array for group with no members",
      async () => {
        const newGroupId = await createGroup("Empty Group");
        const groupDetails = await getGroupDetails(newGroupId);

        expect(groupDetails.memberCount).toBe(0);
        expect(groupDetails.members).toEqual([]);
      });
  });

  describe("getUserDetails", () => {
    it("should return user details with groups", async () => {
      await addUserToGroup(testUserId, testGroupId);

      const userDetails = await getUserDetails(testUserId);

      expect(userDetails).toBeDefined();
      expect(userDetails.userId).toBe(testUserId);
      expect(userDetails.displayName).toBe("Test User");
      expect(userDetails.email).toBe("test@example.com");
      expect(userDetails.groups).toBeDefined();
      expect(Array.isArray(userDetails.groups)).toBe(true);
      expect(userDetails.groups.length).toBe(1);
      expect(userDetails.groups[0].groupId).toBe(testGroupId);
    });

    it("should return empty groups array for user with no groups", async () => {
      const userDetails = await getUserDetails(testUserId);

      expect(userDetails.groups).toEqual([]);
    });
  });

  describe("getGroupMembers", () => {
    beforeEach(async () => {
      await addUserToGroup(testUserId, testGroupId);
    });

    it("should return group members", async () => {
      const members = await getGroupMembers(testGroupId);

      expect(Array.isArray(members)).toBe(true);
      expect(members.length).toBe(1);
      expect(members[0].userId).toBe(testUserId);
      expect(members[0].balance).toBe(0);
      expect(members[0].isAdmin).toBe(true); // First user is admin
    });

    it("should return empty array for group with no members", async () => {
      const newGroupId = await createGroup("Empty Group");
      const members = await getGroupMembers(newGroupId);

      expect(members).toEqual([]);
    });
  });

  describe("getUserBuckets", () => {
    beforeEach(async () => {
      await addUserToGroup(testUserId, testGroupId);
    });

    it("should return empty buckets for new user", async () => {
      const buckets = await getUserBuckets(testGroupId, testUserId);

      expect(Array.isArray(buckets)).toBe(true);
      expect(buckets).toEqual([]);
    });
  });

  describe("getGroupConsumption", () => {
    beforeEach(async () => {
      await addUserToGroup(testUserId, testGroupId);
    });

    it("should return empty consumption for new group", async () => {
      const consumption = await getGroupConsumption(testGroupId);

      expect(Array.isArray(consumption)).toBe(true);
      expect(consumption).toEqual([]);
    });
  });

  describe("createKittyTransaction", () => {
    beforeEach(async () => {
      await addUserToGroup(testUserId, testGroupId);
    });

    it("should create a transaction with valid data", async () => {
      const amount = 25.50;
      const comment = "Lunch payment";

      const transactionId = await createKittyTransaction(
        testGroupId,
        testUserId,
        amount,
        comment
      );

      expect(transactionId).toBeDefined();
      expect(typeof transactionId).toBe("string");
      expect(transactionId.length).toBeGreaterThan(0);

      // Verify transaction was created
      const db = admin.firestore();
      const transactionDoc = await db
        .collection("groups").doc(testGroupId)
        .collection("transactions").doc(transactionId).get();

      expect(transactionDoc.exists).toBe(true);
      expect(transactionDoc.data()?.userId).toBe(testUserId);
      expect(transactionDoc.data()?.amount).toBe(amount);
      expect(transactionDoc.data()?.comment).toBe(comment);
      expect(transactionDoc.data()?.createdAt).toBeDefined();
    });

    it("should create transaction without comment", async () => {
      const amount = 10.00;

      const transactionId = await createKittyTransaction(
        testGroupId,
        testUserId,
        amount
      );

      expect(transactionId).toBeDefined();

      const db = admin.firestore();
      const transactionDoc = await db
        .collection("groups").doc(testGroupId)
        .collection("transactions").doc(transactionId).get();

      expect(transactionDoc.data()?.comment).toBe(""); // No comment provided
    });
  });

  describe("getGroupTransactions", () => {
    beforeEach(async () => {
      await addUserToGroup(testUserId, testGroupId);
    });

    it("should return empty transactions for new group", async () => {
      const transactions = await getGroupTransactions(testGroupId);

      expect(Array.isArray(transactions)).toBe(true);
      expect(transactions).toEqual([]);
    });

    it("should return transactions after creating them", async () => {
      await createKittyTransaction(testGroupId, testUserId, 15.00, "Coffee");
      await createKittyTransaction(testGroupId, testUserId, 25.00, "Lunch");

      const transactions = await getGroupTransactions(testGroupId);

      expect(transactions.length).toBe(2);
      // Transactions are ordered by createdAt desc, so newest first
      expect(transactions[0].amount).toBe(25.00);
      expect(transactions[1].amount).toBe(15.00);
      expect(transactions[0].comment).toBe("Lunch");
      expect(transactions[1].comment).toBe("Coffee");
    });
  });
});
