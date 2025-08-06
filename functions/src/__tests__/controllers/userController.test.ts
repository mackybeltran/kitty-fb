import * as supertest from "supertest";
import {testEnv, createTestUser, cleanupTestData} from "../setup/unit-setup";
import {app} from "../../app";

const api = supertest(app);

describe("User Controller", () => {
  let testUserId: string;

  beforeEach(async () => {
    await cleanupTestData();
  });

  afterAll(async () => {
    await cleanupTestData();
    testEnv.cleanup();
  });

  describe("POST /users/new", () => {
    // 🔴 RED: Write failing tests first
    it("should create a new user with valid data", async () => {
      const userData = {
        displayName: "John Doe",
        email: "john@example.com",
      };

      const response = await api
        .post("/users/new")
        .send(userData)
        .expect(201);

      expect(response.body).toHaveProperty("userId");
      expect(typeof response.body.userId).toBe("string");
      expect(response.body.userId.length).toBeGreaterThan(0);
    });

    it("should return 400 for missing displayName", async () => {
      const userData = {
        email: "john@example.com",
      };

      const response = await api
        .post("/users/new")
        .send(userData)
        .expect(400);

      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toContain("displayName");
    });

    it("should return 400 for missing email", async () => {
      const userData = {
        displayName: "John Doe",
      };

      const response = await api
        .post("/users/new")
        .send(userData)
        .expect(400);

      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toContain("email");
    });

    it("should return 400 for invalid email format", async () => {
      const userData = {
        displayName: "John Doe",
        email: "invalid-email",
      };

      const response = await api
        .post("/users/new")
        .send(userData)
        .expect(400);

      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toContain("email");
    });

    it("should return 400 for empty displayName", async () => {
      const userData = {
        displayName: "",
        email: "john@example.com",
      };

      const response = await api
        .post("/users/new")
        .send(userData)
        .expect(400);

      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toContain("displayName");
    });
  });

  describe("GET /users/:userId", () => {
    beforeEach(async () => {
      testUserId = await createTestUser();
      // Add small delay to ensure data is written
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    // 🔴 RED: Write failing tests first
    it("should return user details for valid userId", async () => {
      const response = await api
        .get(`/users/${testUserId}`)
        .expect(200);

      expect(response.body).toHaveProperty("id", testUserId);
      expect(response.body).toHaveProperty("displayName", "Test User");
      expect(response.body).toHaveProperty("email", "test@example.com");
      expect(response.body).toHaveProperty("createdAt");
      expect(response.body).toHaveProperty("groups");
      expect(Array.isArray(response.body.groups)).toBe(true);
    });

    it("should return 404 for non-existent userId", async () => {
      const nonExistentId = "non-existent-id";

      const response = await api
        .get(`/users/${nonExistentId}`)
        .expect(404);

      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toContain("not found");
    });

    it("should return 400 for invalid userId format", async () => {
      const invalidId = "invalid@id#format";
      // Special chars don't match pattern

      const response = await api
        .get(`/users/${invalidId}`)
        .expect(400);

      expect(response.body).toHaveProperty("error");
    });
  });

  describe("Edge Cases and Integration", () => {
    // 🔴 RED: Write failing tests for edge cases
    it("should handle concurrent user creation", async () => {
      const userData = {
        displayName: "Concurrent User",
        email: "concurrent@example.com",
      };

      const promises = [
        api.post("/users/new").send(userData),
        api.post("/users/new").send(userData),
        api.post("/users/new").send(userData),
      ];

      const responses = await Promise.all(promises);

      // At least one should succeed
      const successfulResponses = responses.filter((r) => r.status === 201);
      expect(successfulResponses.length).toBeGreaterThan(0);
    });

    it("should handle special characters in displayName", async () => {
      const userData = {
        displayName: "José María O'Connor-Smith",
        email: "jose@example.com",
      };

      const response = await api
        .post("/users/new")
        .send(userData)
        .expect(201);

      expect(response.body).toHaveProperty("userId");
    });

    it("should handle very long displayName", async () => {
      const longName = "A".repeat(100);
      const userData = {
        displayName: longName,
        email: "longname@example.com",
      };

      const response = await api
        .post("/users/new")
        .send(userData)
        .expect(201);

      expect(response.body).toHaveProperty("userId");
    });
  });
});
