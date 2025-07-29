import {Request, Response} from "express";
import {
  createGroup,
  addUserToGroup,
  getGroupDetails,
  getGroupMembers,
  getUserBuckets,
  getGroupConsumption,
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
