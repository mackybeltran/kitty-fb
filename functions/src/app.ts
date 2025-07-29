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
  validateGroupIdParam,
  validateUserIdParam,
  validateGroupAndUserIdParam,
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

// DEVELOPMENT UTILITIES - WARNING: These endpoints modify database data

// Handle checking if dev utilities are available
app.get("/dev/status", asyncHandler(DevController.getStatus));

// Handle getting database statistics
app.get("/dev/stats", asyncHandler(DevController.getStats));

// Handle wiping the database
app.delete("/dev/wipe", asyncHandler(DevController.wipeDatabase));

// Handle seeding the database
app.post("/dev/seed", asyncHandler(DevController.seedDatabase));

// Handle resetting the database
app.post("/dev/reset", asyncHandler(DevController.resetDatabase));

// Handle non-existing routes
app.use((req, res) => {
  res.status(404).json({error: "Route not found"});
});

// Error handling middleware (must be last)
app.use(errorHandler);

export default app;
