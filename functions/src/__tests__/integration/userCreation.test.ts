import * as supertest from "supertest";
import {app} from "../app";

const api = supertest(app);

/**
 * TDD: Red-Green-Refactor Cycle
 *
 * 🔴 RED: Write a failing test first
 * This test will fail because we haven't implemented the validation yet
 */
describe("User Creation - TDD Cycle", () => {
  describe("🔴 RED: POST /users/new - Validation Tests", () => {
    it("should return 400 when displayName is missing", async () => {
      // Arrange: Prepare test data
      const userData = {
        email: "test@example.com",
        // displayName is intentionally missing
      };

      // Act: Make the request
      const response = await api
        .post("/users/new")
        .send(userData);

      // Assert: Expect it to fail (this is the RED phase)
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toContain("displayName");
    });

    it("should return 400 when email is missing", async () => {
      // Arrange
      const userData = {
        displayName: "Test User",
        // email is intentionally missing
      };

      // Act
      const response = await api
        .post("/users/new")
        .send(userData);

      // Assert: Expect it to fail (RED phase)
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toContain("email");
    });

    it("should return 400 when email format is invalid", async () => {
      // Arrange
      const userData = {
        displayName: "Test User",
        email: "invalid-email-format",
      };

      // Act
      const response = await api
        .post("/users/new")
        .send(userData);

      // Assert: Expect it to fail (RED phase)
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toContain("email");
    });
  });
});
