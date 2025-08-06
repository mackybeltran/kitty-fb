import {
  createUser,
  updateUserProfile,
  findUserByPhoneNumber,
  cleanupTestData,
  admin,
} from "../setup/unit-setup";
import {
  createUserSchema,
  updateUserProfileSchema,
} from "../../schemas/validationSchemas";

describe("Phone Number Functionality (Unit Tests)", () => {
  afterEach(async () => {
    await cleanupTestData();
  });

  describe("User Schema Validation", () => {
    it("should accept valid phone numbers", () => {
      const validPhoneNumbers = [
        "+1234567890",
        "+44123456789",
        "1234567890",
        "+61412345678",
      ];

      for (const phoneNumber of validPhoneNumbers) {
        const result = createUserSchema.validate({
          displayName: "Test User",
          email: "test@example.com",
          phoneNumber: phoneNumber,
        });

        expect(result.error).toBeUndefined();
        expect(result.value.phoneNumber).toBe(phoneNumber);
      }
    });

    it("should reject invalid phone numbers", () => {
      const invalidPhoneNumbers = [
        "123", // too short
        "abc123", // contains letters
        "+12345678901234567890", // too long
        "123-456-7890", // contains dashes
        "(123) 456-7890", // contains parentheses
      ];

      for (const phoneNumber of invalidPhoneNumbers) {
        const result = createUserSchema.validate({
          displayName: "Test User",
          email: "test@example.com",
          phoneNumber: phoneNumber,
        });

        expect(result.error).toBeDefined();
        expect(result.error?.message).toContain("valid phone number");
      }
    });

    it("should reject empty phone number", () => {
      const result = createUserSchema.validate({
        displayName: "Test User",
        email: "test@example.com",
        phoneNumber: "",
      });

      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain("empty");
    });

    it("should make phone number optional", () => {
      const result = createUserSchema.validate({
        displayName: "Test User",
        email: "test@example.com",
        // no phoneNumber
      });

      expect(result.error).toBeUndefined();
      expect(result.value.phoneNumber).toBeUndefined();
    });
  });

  describe("Update User Profile Schema", () => {
    it("should require phone number in update schema", () => {
      const result = updateUserProfileSchema.validate({
        // no phoneNumber
      });

      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain("required");
    });

    it("should accept valid phone number in update schema", () => {
      const result = updateUserProfileSchema.validate({
        phoneNumber: "+1234567890",
      });

      expect(result.error).toBeUndefined();
      expect(result.value.phoneNumber).toBe("+1234567890");
    });
  });

  describe("Firestore Operations", () => {
    it("should create user with phone number", async () => {
      const userId = await createUser("Test User",
        "test@example.com", "+1234567890");

      // Verify user was created
      const db = admin.firestore();
      const userDoc = await db.collection("users").doc(userId).get();

      expect(userDoc.exists).toBe(true);
      expect(userDoc.data()?.displayName).toBe("Test User");
      expect(userDoc.data()?.email).toBe("test@example.com");
      expect(userDoc.data()?.phoneNumber).toBe("+1234567890");
    });

    it("should create user without phone number", async () => {
      const userId = await createUser("Test User", "test@example.com");

      // Verify user was created
      const db = admin.firestore();
      const userDoc = await db.collection("users").doc(userId).get();

      expect(userDoc.exists).toBe(true);
      expect(userDoc.data()?.displayName).toBe("Test User");
      expect(userDoc.data()?.email).toBe("test@example.com");
      expect(userDoc.data()?.phoneNumber).toBeUndefined();
    });

    it("should update user profile with phone number", async () => {
      // Create user without phone number
      const userId = await createUser("Test User", "test@example.com");

      // Update with phone number
      await updateUserProfile(userId, {phoneNumber: "+1234567890"});

      // Verify update
      const db = admin.firestore();
      const userDoc = await db.collection("users").doc(userId).get();

      expect(userDoc.data()?.phoneNumber).toBe("+1234567890");
      expect(userDoc.data()?.updatedAt).toBeDefined();
    });

    it("should find user by phone number", async () => {
      // Create user with phone number
      const userId = await createUser("Test User",
        "test@example.com", "+1234567890");

      // Find by phone number
      const foundUser = await findUserByPhoneNumber("+1234567890");

      expect(foundUser).toBeDefined();
      expect(foundUser?.userId).toBe(userId);
      expect(foundUser?.displayName).toBe("Test User");
      expect(foundUser?.email).toBe("test@example.com");
      expect(foundUser?.phoneNumber).toBe("+1234567890");
    });

    it("should return null for non-existent phone number", async () => {
      // Create user with different phone number
      await createUser("Test User", "test@example.com", "+1234567890");

      // Search for different phone number
      const foundUser = await findUserByPhoneNumber("+9876543210");

      expect(foundUser).toBeNull();
    });

    it("should handle multiple users with different phone numbers",
      async () => {
      // Create multiple users
        const user1Id = await createUser("User 1", "user1@example.com",
          "+1111111111");
        const user2Id = await createUser("User 2", "user2@example.com",
          "+2222222222");

        // Find each user
        const foundUser1 = await findUserByPhoneNumber("+1111111111");
        const foundUser2 = await findUserByPhoneNumber("+2222222222");

        expect(foundUser1?.userId).toBe(user1Id);
        expect(foundUser2?.userId).toBe(user2Id);
        expect(foundUser1?.displayName).toBe("User 1");
        expect(foundUser2?.displayName).toBe("User 2");
      });
  });
});
