import {Request, Response} from "express";
import {generateQRCode, processQRCode} from "../services/firestore";

/**
 * QR Code Controller
 *
 * Handles QR code generation and processing endpoints.
 * Provides functionality for creating QR codes for groups
 * and processing scanned QR codes to determine appropriate actions.
 */
export class QRCodeController {
  /**
   * Generates a QR code for a group
   *
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   */
  static async generateQRCode(req: Request, res: Response): Promise<void> {
    try {
      const {groupId} = req.params;
      const {type, size, includeLogo} = req.body;

      const result = await generateQRCode(groupId, type, size, includeLogo);

      res.status(200).json({
        success: true,
        data: result,
        message: "QR code generated successfully",
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message :
          "Failed to generate QR code",
        statusCode: 400,
      });
    }
  }

  /**
   * Processes a scanned QR code
   *
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   */
  static async processQRCode(req: Request, res: Response): Promise<void> {
    try {
      const {qrData, userContext} = req.body;

      const result = await processQRCode(qrData, userContext);

      res.status(200).json({
        success: true,
        data: result,
        message: `QR code processed. Action: ${result.action}`,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message :
          "Failed to process QR code",
        statusCode: 400,
      });
    }
  }

  /**
   * Generates and returns QR code as an image
   *
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   */
  static async generateQRCodeImage(req: Request, res: Response): Promise<void> {
    try {
      const {groupId} = req.params;
      const {type, size, includeLogo} = req.body;

      const result = await generateQRCode(groupId, type, size, includeLogo);

      // Convert data URL to buffer
      const base64Data = result.qrCodeDataUrl.replace(
        /^data:image\/png;base64,/,
        ""
      );
      const buffer = Buffer.from(base64Data, "base64");

      // Set response headers for image
      res.setHeader("Content-Type", "image/png");
      res.setHeader("Content-Length", buffer.length);
      res.setHeader("Cache-Control", "public, max-age=3600"); // Cache 1 hour

      res.send(buffer);
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message :
          "Failed to generate QR code image",
        statusCode: 400,
      });
    }
  }
}
