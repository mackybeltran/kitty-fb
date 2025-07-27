import * as express from "express";
import {createUser, createGroup, addUserToGroup} from "./services/firestore";

const app = express();
app.use(express.json());

// Handle creating a new user
app.post("/users/new", async (req, res) => {
  const {displayName, email} = req.body;
  if (!displayName || !email) {
    return res.status(400).json({error: "Missing displayName or email"});
  }
  try {
    const userId = await createUser(displayName, email);
    return res.status(201).json({userId});
  } catch (error: unknown) {
    console.error("Error creating user:", error);
    return res.status(500).json({
      error: "Failed to create user",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Handle creating a new group
app.post("/groups/new", async (req, res) => {
  const {name} = req.body;
  if (!name || typeof name !== "string") {
    return res.status(400).json({error: "Missing name or invalid name type"});
  }
  try {
    const groupId = await createGroup(name);
    return res.status(201).json({groupId});
  } catch (error: unknown) {
    console.error("Error creating group:", error);
    return res.status(500).json({
      error: "Failed to create group",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Handle adding a user to a group
app.post("/groups/:groupId/members", async (req, res) => {
  const {groupId} = req.params;
  const {userId} = req.body;

  if (!userId) {
    return res.status(400).json({error: "Missing userId"});
  }

  try {
    await addUserToGroup(userId, groupId);
    return res.status(200).json({message: "User added to group successfully"});
  } catch (error: unknown) {
    console.error("Error adding user to group:", error);

    const errorMessage = error instanceof Error ?
      error.message : "Unknown error";

    if (errorMessage.includes("not found")) {
      return res.status(404).json({error: errorMessage});
    }

    if (errorMessage.includes("already a member")) {
      return res.status(409).json({error: errorMessage});
    }

    return res.status(500).json({
      error: "Failed to add user to group",
      details: errorMessage,
    });
  }
});

// Handle non-existing routes
app.use((req, res) => {
  res.status(404).json({error: "Route not found"});
});

export default app;
