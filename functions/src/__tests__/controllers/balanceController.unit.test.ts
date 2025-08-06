import {Request, Response} from "express";
import {
  testEnv,
  createTestUser,
  createTestGroup,
  cleanupTestData,
} from "../setup/unit-setup";
import {BalanceController} from "../../controllers/balanceController";
import {updateUserBalance} from "../../services/firestore";

// Mock the firestore service
jest.mock("../../services/firestore");
const mockUpdateUserBalance = updateUserBalance as jest.MockedFunction<
  typeof updateUserBalance
>;

describe("Balance Controller (Unit Tests)", () => {
  let testUserId: string;
  let testGroupId: string;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;

  beforeEach(async () => {
    await cleanupTestData();
    testUserId = await createTestUser();
    testGroupId = await createTestGroup();

    // Setup mock response
    mockJson = jest.fn().mockReturnThis();
    mockStatus = jest.fn().mockReturnThis();

    mockResponse = {
      status: mockStatus,
      json: mockJson,
    };

    // Reset mocks
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await cleanupTestData();
    testEnv.cleanup();
  });

  describe("updateUserBalance", () => {
    it("should update user balance successfully", async () => {
      // Arrange
      const amount = 25.50;
      const adminUserId = "admin-user-id";

      mockRequest = {
        params: {
          groupId: testGroupId,
          userId: testUserId,
        },
        body: {
          amount,
          adminUserId,
        },
      };

      mockUpdateUserBalance.mockResolvedValue(undefined);

      // Act
      await BalanceController.updateUserBalance(
        mockRequest as Request,
        mockResponse as Response
      );

      // Assert
      expect(mockUpdateUserBalance).toHaveBeenCalledWith(
        testGroupId,
        testUserId,
        amount,
        adminUserId
      );
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        message: "User balance updated successfully",
        details: {
          groupId: testGroupId,
          userId: testUserId,
          amount,
          adminUserId,
        },
      });
    });

    it("should handle positive balance updates", async () => {
      // Arrange
      const amount = 100.00;
      const adminUserId = "admin-user-id";

      mockRequest = {
        params: {
          groupId: testGroupId,
          userId: testUserId,
        },
        body: {
          amount,
          adminUserId,
        },
      };

      mockUpdateUserBalance.mockResolvedValue(undefined);

      // Act
      await BalanceController.updateUserBalance(
        mockRequest as Request,
        mockResponse as Response
      );

      // Assert
      expect(mockUpdateUserBalance).toHaveBeenCalledWith(
        testGroupId,
        testUserId,
        amount,
        adminUserId
      );
      expect(mockStatus).toHaveBeenCalledWith(200);
    });

    it("should handle negative balance updates", async () => {
      // Arrange
      const amount = -50.00;
      const adminUserId = "admin-user-id";

      mockRequest = {
        params: {
          groupId: testGroupId,
          userId: testUserId,
        },
        body: {
          amount,
          adminUserId,
        },
      };

      mockUpdateUserBalance.mockResolvedValue(undefined);

      // Act
      await BalanceController.updateUserBalance(
        mockRequest as Request,
        mockResponse as Response
      );

      // Assert
      expect(mockUpdateUserBalance).toHaveBeenCalledWith(
        testGroupId,
        testUserId,
        amount,
        adminUserId
      );
      expect(mockStatus).toHaveBeenCalledWith(200);
    });

    it("should handle zero balance updates", async () => {
      // Arrange
      const amount = 0;
      const adminUserId = "admin-user-id";

      mockRequest = {
        params: {
          groupId: testGroupId,
          userId: testUserId,
        },
        body: {
          amount,
          adminUserId,
        },
      };

      mockUpdateUserBalance.mockResolvedValue(undefined);

      // Act
      await BalanceController.updateUserBalance(
        mockRequest as Request,
        mockResponse as Response
      );

      // Assert
      expect(mockUpdateUserBalance).toHaveBeenCalledWith(
        testGroupId,
        testUserId,
        amount,
        adminUserId
      );
      expect(mockStatus).toHaveBeenCalledWith(200);
    });

    it("should handle decimal balance updates", async () => {
      // Arrange
      const amount = 12.75;
      const adminUserId = "admin-user-id";

      mockRequest = {
        params: {
          groupId: testGroupId,
          userId: testUserId,
        },
        body: {
          amount,
          adminUserId,
        },
      };

      mockUpdateUserBalance.mockResolvedValue(undefined);

      // Act
      await BalanceController.updateUserBalance(
        mockRequest as Request,
        mockResponse as Response
      );

      // Assert
      expect(mockUpdateUserBalance).toHaveBeenCalledWith(
        testGroupId,
        testUserId,
        amount,
        adminUserId
      );
      expect(mockStatus).toHaveBeenCalledWith(200);
    });

    it("should handle different admin users", async () => {
      // Arrange
      const amount = 30.00;
      const adminUserId = "different-admin-id";

      mockRequest = {
        params: {
          groupId: testGroupId,
          userId: testUserId,
        },
        body: {
          amount,
          adminUserId,
        },
      };

      mockUpdateUserBalance.mockResolvedValue(undefined);

      // Act
      await BalanceController.updateUserBalance(
        mockRequest as Request,
        mockResponse as Response
      );

      // Assert
      expect(mockUpdateUserBalance).toHaveBeenCalledWith(
        testGroupId,
        testUserId,
        amount,
        adminUserId
      );
      expect(mockJson).toHaveBeenCalledWith({
        message: "User balance updated successfully",
        details: {
          groupId: testGroupId,
          userId: testUserId,
          amount,
          adminUserId,
        },
      });
    });
  });
});
