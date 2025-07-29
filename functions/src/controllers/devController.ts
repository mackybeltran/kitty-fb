import {Request, Response} from "express";
import {
  wipeDatabase,
  seedDatabase,
  resetDatabase,
  getDatabaseStats,
  isDevUtilitiesAvailable,
} from "../utils/databaseUtils";

/**
 * Development Controller
 *
 * Handles all development utilities including database management.
 * Follows MVC pattern by separating business logic from request handling.
 * WARNING: These endpoints modify database data and should only be used
 * in development.
 */
export class DevController {
  /**
   * Gets the status of development utilities
   *
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @return {Promise<void>}
   */
  static async getStatus(req: Request, res: Response): Promise<void> {
    const available = isDevUtilitiesAvailable();
    res.status(200).json({
      message: "Development utilities status",
      available,
      environment: process.env.NODE_ENV || "development",
    });
  }

  /**
   * Gets database statistics
   *
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @return {Promise<void>}
   */
  static async getStats(req: Request, res: Response): Promise<void> {
    const stats = await getDatabaseStats();
    res.status(200).json({
      message: "Database statistics",
      stats,
    });
  }

  /**
   * Wipes the database
   *
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @return {Promise<void>}
   */
  static async wipeDatabase(req: Request, res: Response): Promise<void> {
    const {collections = ["users", "groups"]} = req.body;
    await wipeDatabase(collections);
    res.status(200).json({
      message: "Database wiped successfully",
      collections,
    });
  }

  /**
   * Seeds the database with test data
   *
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @return {Promise<void>}
   */
  static async seedDatabase(req: Request, res: Response): Promise<void> {
    const options = req.body || {};
    const testData = await seedDatabase(options);
    res.status(200).json({
      message: "Database seeded successfully",
      testData,
    });
  }

  /**
   * Resets the database (wipe + seed)
   *
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @return {Promise<void>}
   */
  static async resetDatabase(req: Request, res: Response): Promise<void> {
    const options = req.body || {};
    const testData = await resetDatabase(options);
    res.status(200).json({
      message: "Database reset successfully",
      testData,
    });
  }
}
