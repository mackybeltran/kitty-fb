import * as express from "express";
import {createUser, createGroup} from "./services/firestore";

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

// Handle non-existing routes
app.use((req, res) => {
  res.status(404).json({error: "Route not found"});
});

export default app;
