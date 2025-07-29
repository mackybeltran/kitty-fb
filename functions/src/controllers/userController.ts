import {Request, Response} from "express";
import {createUser, getUserDetails} from "../services/firestore";

/**
 * User Controller
 *
 * Handles all user-related operations including creation and retrieval.
 * Follows MVC pattern by separating business logic from request handling.
 */
export class UserController {
  /**
   * Creates a new user
   *
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @return {Promise<void>}
   */
  static async createUser(req: Request, res: Response): Promise<void> {
    const {displayName, email} = req.body;
    const userId = await createUser(displayName, email);
    res.status(201).json({userId});
  }

  /**
   * Gets detailed information about a user
   *
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @return {Promise<void>}
   */
  static async getUserDetails(req: Request, res: Response): Promise<void> {
    const {userId} = req.params;
    const userDetails = await getUserDetails(userId);
    res.status(200).json(userDetails);
  }
}
