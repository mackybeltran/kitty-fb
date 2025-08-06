import {createUserSchema} from "../../schemas/validationSchemas";
import {
  testEnv,
  createTestUser,
  cleanupTestData,
  admin,
} from "../setup/unit-setup";

describe("User Validation (Unit Tests)", () => {
  beforeEach(async () => {
    await cleanupTestData();
  });

  afterAll(async () => {
    await cleanupTestData();
    testEnv.cleanup();
  });

  describe("Email Validation", () => {
    it("should accept valid email formats", async () => {
      const validEmails = [
        "test@example.com",
        "user.name@domain.co.uk",
        "user+tag@example.org",
      ];

      for (const email of validEmails) {
        const result = createUserSchema.validate({
          displayName: "Test User",
          email: email,
        });

        expect(result.error).toBeUndefined();
        expect(result.value.email).toBe(email.toLowerCase()); // Normalized
      }
    });

    it("should reject invalid email formats", async () => {
      const invalidEmails = [
        "invalid-email",
        "@example.com",
        "user@",
        "user.example.com",
      ];

      for (const email of invalidEmails) {
        const result = createUserSchema.validate({
          displayName: "Test User",
          email: email,
        });

        expect(result.error).toBeDefined();
        expect(result.error?.message).toContain("valid email address");
      }
    });
  });

  describe("Display Name Validation", () => {
    it("should accept valid display names", async () => {
      const validNames = [
        "John Doe",
        "José María",
        "O'Connor-Smith",
        "A".repeat(50), // 50 characters
      ];

      for (const name of validNames) {
        const result = createUserSchema.validate({
          displayName: name,
          email: "test@example.com",
        });

        expect(result.error).toBeUndefined();
        expect(result.value.displayName).toBe(name.trim()); // Should be trimmed
      }
    });

    it("should reject empty display names", async () => {
      const result = createUserSchema.validate({
        displayName: "",
        email: "test@example.com",
      });

      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain("empty");
    });

    it("should reject display names that are too long", async () => {
      const longName = "A".repeat(101); // 101 characters
      const result = createUserSchema.validate({
        displayName: longName,
        email: "test@example.com",
      });

      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain("100 characters");
    });
  });

  describe("Required Fields Validation", () => {
    it("should reject missing displayName", async () => {
      const result = createUserSchema.validate({
        email: "test@example.com",
      });

      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain("required");
    });

    it("should reject missing email", async () => {
      const result = createUserSchema.validate({
        displayName: "Test User",
      });

      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain("required");
    });
  });

  describe("Database Operations (Unit)", () => {
    it("should create user in emulator database", async () => {
      const userId = await createTestUser();

      // Verify user was created in emulator
      const db = admin.firestore();
      const userDoc = await db.collection("users").doc(userId).get();

      expect(userDoc.exists).toBe(true);
      expect(userDoc.data()?.displayName).toBe("Test User");
      expect(userDoc.data()?.email).toBe("test@example.com");
    });

    it("should clean up test data", async () => {
      const userId = await createTestUser();

      // Verify user exists
      const db = admin.firestore();
      const userDoc = await db.collection("users").doc(userId).get();
      expect(userDoc.exists).toBe(true);

      // Clean up
      await cleanupTestData();

      // Verify user is gone
      const userDocAfter = await db.collection("users").doc(userId).get();
      expect(userDocAfter.exists).toBe(false);
    });
  });
});
