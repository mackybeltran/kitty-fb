import {Request, Response, NextFunction} from "express";

/**
 * ERROR HANDLING MIDDLEWARE
 *
 * This middleware centralizes all error handling logic for the application.
 * It provides consistent error responses and proper HTTP status codes
 * based on the type of error encountered.
 *
 * Benefits:
 * - Consistent error format across all endpoints
 * - Centralized error logging
 * - Proper HTTP status codes
 * - Clean route handlers (no try-catch blocks needed)
 * - Easy to extend with new error types
 */

/**
 * Custom error class for application-specific errors
 */
export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  /**
   * Creates a new AppError instance
   * @param {string} message - Error message
   * @param {number} statusCode - HTTP status code
   * @param {boolean} isOperational - Whether this is an operational error
   */
  constructor(message: string, statusCode: number, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Error handler middleware
 *
 * This function catches all errors thrown in route handlers and
 * converts them to appropriate HTTP responses with proper status codes.
 *
 * @param {Error} error - The error that was thrown
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} _next - Express next function (unused)
 */
export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  console.error("Error occurred:", {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    body: req.body,
    params: req.params,
  });

  // Handle our custom AppError
  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      error: error.message,
      statusCode: error.statusCode,
    });
    return;
  }

  // Handle specific error messages from our business logic
  const errorMessage = error.message.toLowerCase();

  // Validation errors (400 Bad Request)
  if (
    errorMessage.includes("missing") ||
    errorMessage.includes("invalid") ||
    errorMessage.includes("less than 0") ||
    errorMessage.includes("withdraw more than current balance") ||
    errorMessage.includes("insufficient funds in kitty")
  ) {
    res.status(400).json({
      error: error.message,
      statusCode: 400,
    });
    return;
  }

  // Not found errors (404 Not Found)
  if (
    errorMessage.includes("not found") ||
    errorMessage.includes("not a member")
  ) {
    res.status(404).json({
      error: error.message,
      statusCode: 404,
    });
    return;
  }

  // Conflict errors (409 Conflict)
  if (errorMessage.includes("already a member")) {
    res.status(409).json({
      error: error.message,
      statusCode: 409,
    });
    return;
  }

  // Default server error (500 Internal Server Error)
  res.status(500).json({
    error: "Internal server error",
    statusCode: 500,
    details: process.env.NODE_ENV === "development" ? error.message : undefined,
  });
};

/**
 * Async error wrapper
 *
 * This utility function wraps async route handlers to automatically
 * catch errors and pass them to the error handling middleware.
 *
 * @param {Function} fn - Async route handler function
 * @return {Function} Wrapped function that handles errors
 *
 * @example
 * // Instead of:
 * app.post('/users', async (req, res, next) => {
 *   try {
 *     const result = await createUser(req.body);
 *     res.json(result);
 *   } catch (error) {
 *     next(error);
 *   }
 * });
 *
 * // Use:
 * app.post('/users', asyncHandler(async (req, res) => {
 *   const result = await createUser(req.body);
 *   res.json(result);
 * }));
 */
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Utility functions for throwing common errors
 */
/**
 * Throws a 404 Not Found error
 * @param {string} message - Error message
 */
export const throwNotFound = (message: string): never => {
  throw new AppError(message, 404);
};

export const throwBadRequest = (message: string): never => {
  throw new AppError(message, 400);
};

export const throwConflict = (message: string): never => {
  throw new AppError(message, 409);
};

export const throwServerError = (message: string): never => {
  throw new AppError(message, 500);
};
