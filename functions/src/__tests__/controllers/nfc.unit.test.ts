import {
  createUser,
  createTestGroup,
  cleanupTestData,
  admin,
} from "../setup/unit-setup";
import {
  nfcConsumptionSchema,
  nfcProfileUpdateSchema,
  phoneNumberParamSchema,
} from "../../schemas/validationSchemas";

describe("NFC Functionality (Unit Tests)", () => {
  beforeAll(async () => {
    // Create test user and group for setup
    await createUser("Test User", "test@example.com", "+1234567890");
    await createTestGroup();
  });

  afterAll(async () => {
    await cleanupTestData();
  });

  describe("NFC Schema Validation", () => {
    it("should accept valid NFC consumption data", () => {
      const validData = {
        groupId: "test-group",
        amount: 1,
        phoneNumber: "+1234567890",
        userId: "test-user",
      };

      const result = nfcConsumptionSchema.validate(validData);
      expect(result.error).toBeUndefined();
      expect(result.value.groupId).toBe("test-group");
      expect(result.value.amount).toBe(1);
    });

    it("should reject invalid NFC consumption data", () => {
      const invalidData = {
        groupId: "", // empty
        amount: 0, // invalid amount
        phoneNumber: "invalid-phone",
      };

      const result = nfcConsumptionSchema.validate(invalidData);
      expect(result.error).toBeDefined();
    });

    it("should accept valid profile update data", () => {
      const validData = {
        userId: "test-user",
        phoneNumber: "+1234567890",
      };

      const result = nfcProfileUpdateSchema.validate(validData);
      expect(result.error).toBeUndefined();
    });

    it("should reject invalid profile update data", () => {
      const invalidData = {
        userId: "", // empty
        phoneNumber: "invalid-phone",
      };

      const result = nfcProfileUpdateSchema.validate(invalidData);
      expect(result.error).toBeDefined();
    });

    it("should accept valid phone number parameter", () => {
      const validData = {
        phoneNumber: "+1234567890",
      };

      const result = phoneNumberParamSchema.validate(validData);
      expect(result.error).toBeUndefined();
    });

    it("should reject invalid phone number parameter", () => {
      const invalidData = {
        phoneNumber: "invalid-phone",
      };

      const result = phoneNumberParamSchema.validate(invalidData);
      expect(result.error).toBeDefined();
    });
  });

  describe("NFC Data Flow", () => {
    it("should handle user lookup by phone number", async () => {
      // Create a user with phone number
      const userId = await createUser("NFC User",
        "nfc@example.com", "+9876543210");

      // Verify user exists in database
      const db = admin.firestore();
      const userDoc = await db.collection("users").doc(userId).get();

      expect(userDoc.exists).toBe(true);
      expect(userDoc.data()?.phoneNumber).toBe("+9876543210");
    });

    it("should handle profile update with phone number", async () => {
      // Create user without phone number
      const userId = await createUser("No Phone User", "nophone@example.com");

      // Update with phone number
      const db = admin.firestore();
      await db.collection("users").doc(userId).update({
        phoneNumber: "+5555555555",
        updatedAt: new Date(),
      });

      // Verify update
      const userDoc = await db.collection("users").doc(userId).get();
      expect(userDoc.data()?.phoneNumber).toBe("+5555555555");
      expect(userDoc.data()?.updatedAt).toBeDefined();
    });
  });
});
