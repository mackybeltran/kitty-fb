import {Request, Response} from "express";
import {updateUserBalance} from "../services/firestore";

/**
 * Balance Controller
 *
 * Handles all balance-related operations including updating user balances.
 * Follows MVC pattern by separating business logic from request handling.
 */
export class BalanceController {
  /**
   * Updates a user's balance in a group
   *
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @return {Promise<void>}
   */
  static async updateUserBalance(req: Request, res: Response): Promise<void> {
    const {groupId, userId} = req.params;
    const {amount, adminUserId} = req.body;

    await updateUserBalance(groupId, userId, amount, adminUserId);
    res.status(200).json({
      message: "User balance updated successfully",
      details: {
        groupId,
        userId,
        amount,
        adminUserId,
      },
    });
  }
}
