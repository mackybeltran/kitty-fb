import {Request, Response} from "express";
import {
  findUserByPhoneNumber,
  recordConsumption,
  updateUserProfile,
  getGroupDetails,
} from "../services/firestore";

/**
 * NFC Controller
 *
 * Handles NFC-based consumption and onboarding flows.
 * Supports phone number-based user identification for seamless NFC
 * interactions.
 */
export class NFCController {
  /**
   * Handles NFC consumption requests
   *
   * Supports multiple scenarios:
   * 1. User with phone number - direct consumption
   * 2. User without phone number - prompt for phone
   * 3. New user - onboarding flow
   *
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @return {Promise<void>}
   */
  static async consume(req: Request, res: Response): Promise<void> {
    try {
      const {groupId, amount, phoneNumber, userId} = req.body;

      // Validate required fields
      if (!groupId || !amount) {
        res.status(400).json({
          error: "Missing required fields: groupId and amount are required",
          statusCode: 400,
        });
        return;
      }

      // Validate group exists
      const groupDetails = await getGroupDetails(groupId);
      if (!groupDetails) {
        res.status(404).json({
          error: "Group not found",
          statusCode: 404,
        });
        return;
      }

      let targetUserId = userId;

      // If no userId provided, try to find user by phone number
      if (!targetUserId && phoneNumber) {
        const userByPhone = await findUserByPhoneNumber(phoneNumber);
        if (userByPhone) {
          targetUserId = userByPhone.userId;
        }
      }

      // Scenario 1: User identified (by userId or phone number)
      if (targetUserId) {
        try {
          await recordConsumption(groupId, targetUserId, amount);

          res.status(200).json({
            success: true,
            message: "Consumption recorded successfully",
            data: {
              groupId,
              userId: targetUserId,
              amount,
              groupName: groupDetails.name,
            },
          });
          return;
        } catch (error) {
          // User might not be in group or other validation error
          res.status(400).json({
            error: error instanceof Error ? error.message :
              "Failed to record consumption",
            statusCode: 400,
            action: "join-request", // Suggest joining the group
            groupInfo: {
              id: groupId,
              name: groupDetails.name,
            },
          });
          return;
        }
      }

      // Scenario 2: No user identified - onboarding flow
      res.status(200).json({
        success: false,
        message: "User not found",
        action: "onboarding",
        data: {
          groupId,
          groupName: groupDetails.name,
          amount,
          requiresPhoneNumber: !phoneNumber,
        },
      });
    } catch (error) {
      console.error("NFC consumption error:", error);
      res.status(500).json({
        error: "Internal server error",
        statusCode: 500,
      });
    }
  }

  /**
   * Updates user profile with phone number for NFC identification
   *
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @return {Promise<void>}
   */
  static async updateProfile(req: Request, res: Response): Promise<void> {
    try {
      const {userId, phoneNumber} = req.body;

      if (!userId || !phoneNumber) {
        res.status(400).json({
          error: "Missing required fields: userId and phoneNumber are required",
          statusCode: 400,
        });
        return;
      }

      await updateUserProfile(userId, {phoneNumber});

      res.status(200).json({
        success: true,
        message: "Profile updated successfully",
        data: {userId, phoneNumber},
      });
    } catch (error) {
      console.error("Profile update error:", error);
      res.status(500).json({
        error: "Internal server error",
        statusCode: 500,
      });
    }
  }

  /**
   * Looks up user by phone number
   *
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @return {Promise<void>}
   */
  static async lookupUser(req: Request, res: Response): Promise<void> {
    try {
      const {phoneNumber} = req.params;

      if (!phoneNumber) {
        res.status(400).json({
          error: "Phone number is required",
          statusCode: 400,
        });
        return;
      }

      const user = await findUserByPhoneNumber(phoneNumber);

      if (!user) {
        res.status(404).json({
          error: "User not found",
          statusCode: 404,
          action: "onboarding",
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: {
          userId: user.userId,
          displayName: user.displayName,
          email: user.email,
          phoneNumber: user.phoneNumber,
        },
      });
    } catch (error) {
      console.error("User lookup error:", error);
      res.status(500).json({
        error: "Internal server error",
        statusCode: 500,
      });
    }
  }
}
