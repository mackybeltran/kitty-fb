import {Request, Response} from "express";
import {purchaseBuckets, recordConsumption} from "../services/firestore";

/**
 * Bucket Controller
 *
 * Handles all bucket-related operations including purchasing and consumption.
 * Follows MVC pattern by separating business logic from request handling.
 */
export class BucketController {
  /**
   * Purchases buckets for a user in a group
   *
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @return {Promise<void>}
   */
  static async purchaseBuckets(req: Request, res: Response): Promise<void> {
    const {groupId} = req.params;
    const {userId, bucketCount, unitsPerBucket} = req.body;

    const bucketIds = await purchaseBuckets(
      groupId,
      userId,
      bucketCount,
      unitsPerBucket
    );

    res.status(201).json({
      message: "Buckets purchased successfully",
      bucketIds,
      details: {
        groupId,
        userId,
        bucketCount,
        unitsPerBucket,
      },
    });
  }

  /**
   * Records consumption of units from a user's active bucket
   *
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @return {Promise<void>}
   */
  static async recordConsumption(req: Request, res: Response): Promise<void> {
    const {groupId} = req.params;
    const {userId, units} = req.body;

    await recordConsumption(groupId, userId, units);
    res.status(200).json({
      message: "Consumption recorded successfully",
      details: {
        groupId,
        userId,
        units,
      },
    });
  }
}
