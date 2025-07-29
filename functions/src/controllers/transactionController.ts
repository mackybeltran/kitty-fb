import {Request, Response} from "express";
import {
  createKittyTransaction,
  getGroupTransactions,
} from "../services/firestore";

/**
 * Controller for handling kitty balance transactions
 */
export class TransactionController {
  /**
   * Creates a new kitty balance transaction
   *
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @return {Promise<void>}
   */
  static async createKittyTransaction(
    req: Request,
    res: Response
  ): Promise<void> {
    const {groupId} = req.params;
    const {userId, amount, comment} = req.body;

    const transactionId = await createKittyTransaction(
      groupId,
      userId,
      amount,
      comment
    );

    res.status(201).json({
      message: "Kitty transaction created successfully",
      transactionId,
      details: {
        groupId,
        userId,
        amount,
        comment: comment || "",
      },
    });
  }

  /**
   * Gets transaction history for a group
   *
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @return {Promise<void>}
   */
  static async getGroupTransactions(
    req: Request,
    res: Response
  ): Promise<void> {
    const {groupId} = req.params;

    const transactions = await getGroupTransactions(groupId);

    res.status(200).json({
      groupId,
      transactions,
      count: transactions.length,
    });
  }
}
