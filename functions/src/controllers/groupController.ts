import {Request, Response} from "express";
import {
  createGroup,
  addUserToGroup,
  getGroupDetails,
  getGroupMembers,
  getUserBuckets,
  getGroupConsumption,
  createJoinRequest,
  getJoinRequests,
  approveJoinRequest,
  denyJoinRequest,
} from "../services/firestore";

/**
 * Group Controller
 *
 * Handles all group-related operations including creation, member management,
 * and data retrieval. Follows MVC pattern by separating business logic
 * from request handling.
 */
export class GroupController {
  /**
   * Creates a new group
   *
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @return {Promise<void>}
   */
  static async createGroup(req: Request, res: Response): Promise<void> {
    const {name} = req.body;
    const groupId = await createGroup(name);
    res.status(201).json({groupId});
  }

  /**
   * Adds a user to a group
   *
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @return {Promise<void>}
   */
  static async addUserToGroup(req: Request, res: Response): Promise<void> {
    const {groupId} = req.params;
    const {userId, isAdmin} = req.body;

    await addUserToGroup(userId, groupId, isAdmin);
    res.status(200).json({
      message: "User added to group successfully",
    });
  }

  /**
   * Creates a join request for a user to join a group
   *
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @return {Promise<void>}
   */
  static async createJoinRequest(req: Request, res: Response): Promise<void> {
    const {groupId} = req.params;
    const {userId, message} = req.body;

    const requestId = await createJoinRequest(groupId, userId, message);
    res.status(201).json({
      message: "Join request created successfully",
      requestId,
      details: {
        groupId,
        userId,
        message: message || "",
      },
    });
  }

  /**
   * Gets all join requests for a group
   *
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @return {Promise<void>}
   */
  static async getJoinRequests(req: Request, res: Response): Promise<void> {
    const {groupId} = req.params;

    const requests = await getJoinRequests(groupId);
    res.status(200).json({
      groupId,
      requests,
      count: requests.length,
    });
  }

  /**
   * Approves a join request and adds the user to the group
   *
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @return {Promise<void>}
   */
  static async approveJoinRequest(req: Request, res: Response): Promise<void> {
    const {groupId, requestId} = req.params;
    const {adminUserId, reason} = req.body;

    await approveJoinRequest(groupId, requestId, adminUserId, reason);
    res.status(200).json({
      message: "Join request approved successfully",
      details: {
        groupId,
        requestId,
        adminUserId,
        reason: reason || "Approved by admin",
      },
    });
  }

  /**
   * Denies a join request
   *
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @return {Promise<void>}
   */
  static async denyJoinRequest(req: Request, res: Response): Promise<void> {
    const {groupId, requestId} = req.params;
    const {adminUserId, reason} = req.body;

    await denyJoinRequest(groupId, requestId, adminUserId, reason);
    res.status(200).json({
      message: "Join request denied successfully",
      details: {
        groupId,
        requestId,
        adminUserId,
        reason,
      },
    });
  }

  /**
   * Gets detailed information about a group
   *
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @return {Promise<void>}
   */
  static async getGroupDetails(req: Request, res: Response): Promise<void> {
    const {groupId} = req.params;
    const groupDetails = await getGroupDetails(groupId);
    res.status(200).json(groupDetails);
  }

  /**
   * Gets all members of a group
   *
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @return {Promise<void>}
   */
  static async getGroupMembers(req: Request, res: Response): Promise<void> {
    const {groupId} = req.params;
    const members = await getGroupMembers(groupId);
    res.status(200).json(members);
  }

  /**
   * Gets all buckets for a user in a specific group
   *
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @return {Promise<void>}
   */
  static async getUserBuckets(req: Request, res: Response): Promise<void> {
    const {groupId, userId} = req.params;
    const buckets = await getUserBuckets(groupId, userId);
    res.status(200).json(buckets);
  }

  /**
   * Gets consumption history for a group
   *
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @return {Promise<void>}
   */
  static async getGroupConsumption(req: Request, res: Response): Promise<void> {
    const {groupId} = req.params;
    const consumption = await getGroupConsumption(groupId);
    res.status(200).json(consumption);
  }
}
