import * as express from "express";
import {
  createUser,
  createGroup,
  addUserToGroup,
  createTransaction,
} from "./services/firestore";
import {errorHandler, asyncHandler} from "./middleware/errorHandler";
import {
  validateCreateUser,
  validateCreateGroup,
  validateGroupRoute,
  validateTransactionRoute,
} from "./middleware/joiValidation";

const app = express();
app.use(express.json());

// Handle creating a new user
app.post(
  "/users/new",
  validateCreateUser,
  asyncHandler(async (req, res) => {
    const {displayName, email} = req.body;
    const userId = await createUser(displayName, email);
    res.status(201).json({userId});
  })
);

// Handle creating a new group
app.post(
  "/groups/new",
  validateCreateGroup,
  asyncHandler(async (req, res) => {
    const {name} = req.body;
    const groupId = await createGroup(name);
    res.status(201).json({groupId});
  })
);

// Handle adding a user to a group
app.post(
  "/groups/:groupId/members",
  validateGroupRoute,
  asyncHandler(async (req, res) => {
    const {groupId} = req.params;
    const {userId} = req.body;

    await addUserToGroup(userId, groupId);
    res.status(200).json({
      message: "User added to group successfully",
    });
  })
);

// Handle creating a transaction in a group
app.patch(
  "/groups/:groupId/transactions",
  validateTransactionRoute,
  asyncHandler(async (req, res) => {
    const {groupId} = req.params;
    const {userId, amount, comment} = req.body;

    await createTransaction(groupId, userId, amount, comment);
    res.status(200).json({
      message: "Transaction created successfully",
    });
  })
);

// Handle non-existing routes
app.use((req, res) => {
  res.status(404).json({error: "Route not found"});
});

// Error handling middleware (must be last)
app.use(errorHandler);

export default app;
