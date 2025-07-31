import * as express from "express";
import {
  UserController,
  GroupController,
  BucketController,
  BalanceController,
  TransactionController,
  DevController,
} from "./controllers";
import {errorHandler, asyncHandler} from "./middleware/errorHandler";
import {
  validateCreateUser,
  validateCreateGroup,
  validateGroupRoute,
  validateBucketPurchase,
  validateConsumption,
  validateUpdateBalance,
  validateKittyTransaction,
  validateCreateJoinRequest,
  validateApproveJoinRequest,
  validateDenyJoinRequest,
  validateGroupIdParam,
  validateUserIdParam,
  validateGroupAndUserIdParam,
  validateGroupAndRequestIdParam,
} from "./middleware/joiValidation";

const app = express();
app.use(express.json());

// Handle creating a new user
app.post(
  "/users/new",
  validateCreateUser,
  asyncHandler(UserController.createUser)
);

// Handle creating a new group
app.post(
  "/groups/new",
  validateCreateGroup,
  asyncHandler(GroupController.createGroup)
);

// Handle adding a user to a group
app.post(
  "/groups/:groupId/members",
  validateGroupRoute,
  asyncHandler(GroupController.addUserToGroup)
);

// Handle creating a join request
app.post(
  "/groups/:groupId/join-requests",
  validateGroupIdParam,
  validateCreateJoinRequest,
  asyncHandler(GroupController.createJoinRequest)
);

// Handle getting join requests for a group
app.get(
  "/groups/:groupId/join-requests",
  validateGroupIdParam,
  asyncHandler(GroupController.getJoinRequests)
);

// Handle approving a join request
app.post(
  "/groups/:groupId/join-requests/:requestId/approve",
  validateGroupAndRequestIdParam,
  validateApproveJoinRequest,
  asyncHandler(GroupController.approveJoinRequest)
);

// Handle denying a join request
app.post(
  "/groups/:groupId/join-requests/:requestId/deny",
  validateGroupAndRequestIdParam,
  validateDenyJoinRequest,
  asyncHandler(GroupController.denyJoinRequest)
);

// Handle purchasing buckets
app.post(
  "/groups/:groupId/buckets",
  validateBucketPurchase,
  asyncHandler(BucketController.purchaseBuckets)
);

// Handle recording consumption
app.post(
  "/groups/:groupId/consumption",
  validateConsumption,
  asyncHandler(BucketController.recordConsumption)
);

// Handle getting group details
app.get(
  "/groups/:groupId",
  validateGroupIdParam,
  asyncHandler(GroupController.getGroupDetails)
);

// Handle getting group members
app.get(
  "/groups/:groupId/members",
  validateGroupIdParam,
  asyncHandler(GroupController.getGroupMembers)
);

// Handle getting user buckets in a group
app.get(
  "/groups/:groupId/members/:userId/buckets",
  validateGroupAndUserIdParam,
  asyncHandler(GroupController.getUserBuckets)
);

// Handle updating user balance
app.patch(
  "/groups/:groupId/members/:userId/balance",
  validateGroupAndUserIdParam,
  validateUpdateBalance,
  asyncHandler(BalanceController.updateUserBalance)
);

// Handle creating kitty transactions
app.post(
  "/groups/:groupId/transactions",
  validateGroupIdParam,
  validateKittyTransaction,
  asyncHandler(TransactionController.createKittyTransaction)
);

// Handle getting group transaction history
app.get(
  "/groups/:groupId/transactions",
  validateGroupIdParam,
  asyncHandler(TransactionController.getGroupTransactions)
);

// Handle getting group consumption history
app.get(
  "/groups/:groupId/consumption",
  validateGroupIdParam,
  asyncHandler(GroupController.getGroupConsumption)
);

// Handle getting user details
app.get(
  "/users/:userId",
  validateUserIdParam,
  asyncHandler(UserController.getUserDetails)
);

// Development utilities (only available in development)
if (
  process.env.NODE_ENV === "development" ||
  process.env.ENABLE_DEV_UTILITIES === "true"
) {
  // Check dev utilities status
  app.get("/dev/status", asyncHandler(DevController.getStatus));

  // Get database statistics
  app.get("/dev/stats", asyncHandler(DevController.getStats));

  // Wipe database
  app.delete("/dev/wipe", asyncHandler(DevController.wipeDatabase));

  // Seed database
  app.post("/dev/seed", asyncHandler(DevController.seedDatabase));

  // Reset database (wipe + seed)
  app.post("/dev/reset", asyncHandler(DevController.resetDatabase));
}

// Error handling middleware
app.use(errorHandler);

export {app};
