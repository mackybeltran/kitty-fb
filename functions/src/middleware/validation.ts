import {Request, Response, NextFunction} from "express";
import {throwBadRequest} from "./errorHandler";

/**
 * VALIDATION MIDDLEWARE
 *
 * This middleware handles input validation for all endpoints.
 * It provides consistent validation logic and error messages
 * across the application.
 *
 * Benefits:
 * - Centralized validation logic
 * - Consistent error messages
 * - Reusable validation functions
 * - Clean route handlers
 * - Type safety with TypeScript
 */

/**
 * Validates required fields in request body
 *
 * @param {string[]} requiredFields - Array of field names that are required
 * @return {Function} Middleware function
 */
export const validateRequiredFields = (requiredFields: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const missingFields = requiredFields.filter(
      (field) => req.body[field] === undefined || req.body[field] === null
    );

    if (missingFields.length > 0) {
      throwBadRequest(`Missing required fields: ${missingFields.join(", ")}`);
    }

    next();
  };
};

/**
 * Validates field types in request body
 *
 * @param {Record<string, string>} fieldTypes - Object mapping field names to
 * expected types
 * @return {Function} Middleware function
 */
export const validateFieldTypes = (fieldTypes: Record<string, string>) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const invalidFields: string[] = [];

    for (const [field, expectedType] of Object.entries(fieldTypes)) {
      if (req.body[field] !== undefined && req.body[field] !== null) {
        const actualType = typeof req.body[field];
        if (actualType !== expectedType) {
          invalidFields.push(
            `${field} (expected ${expectedType}, got ${actualType})`
          );
        }
      }
    }

    if (invalidFields.length > 0) {
      throwBadRequest(`Invalid field types: ${invalidFields.join(", ")}`);
    }

    next();
  };
};

/**
 * Validates email format
 *
 * @return {Function} Middleware function
 */
export const validateEmail = () => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const email = req.body.email;
    if (email && typeof email === "string") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throwBadRequest("Invalid email format");
      }
    }
    next();
  };
};

/**
 * Validates numeric range for a field
 *
 * @param {string} field - Field name to validate
 * @param {number} min - Minimum allowed value
 * @param {number} max - Maximum allowed value
 * @return {Function} Middleware function
 */
export const validateNumericRange = (
  field: string,
  min?: number,
  max?: number
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const value = req.body[field];
    if (value !== undefined && value !== null) {
      if (typeof value !== "number") {
        throwBadRequest(`${field} must be a number`);
      }

      if (min !== undefined && value < min) {
        throwBadRequest(`${field} must be at least ${min}`);
      }

      if (max !== undefined && value > max) {
        throwBadRequest(`${field} must be at most ${max}`);
      }
    }
    next();
  };
};

/**
 * Validates string length for a field
 *
 * @param {string} field - Field name to validate
 * @param {number} minLength - Minimum allowed length
 * @param {number} maxLength - Maximum allowed length
 * @return {Function} Middleware function
 */
export const validateStringLength = (
  field: string,
  minLength?: number,
  maxLength?: number
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const value = req.body[field];
    if (value !== undefined && value !== null) {
      if (typeof value !== "string") {
        throwBadRequest(`${field} must be a string`);
      }

      if (minLength !== undefined && value.length < minLength) {
        throwBadRequest(`${field} must be at least ${minLength} characters`);
      }

      if (maxLength !== undefined && value.length > maxLength) {
        throwBadRequest(`${field} must be at most ${maxLength} characters`);
      }
    }
    next();
  };
};

/**
 * Validates that a field is not empty (for strings)
 *
 * @param {string} field - Field name to validate
 * @return {Function} Middleware function
 */
export const validateNotEmpty = (field: string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const value = req.body[field];
    if (value !== undefined && value !== null) {
      if (typeof value === "string" && value.trim() === "") {
        throwBadRequest(`${field} cannot be empty`);
      }
    }
    next();
  };
};

/**
 * Validates path parameters exist
 *
 * @param {string[]} requiredParams - Array of required path parameter names
 * @return {Function} Middleware function
 */
export const validatePathParams = (requiredParams: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const missingParams = requiredParams.filter(
      (param) => !req.params[param]
    );

    if (missingParams.length > 0) {
      throwBadRequest(`Missing path parameters: ${missingParams.join(", ")}`);
    }

    next();
  };
};

/**
 * Predefined validation chains for common use cases
 */

/**
 * Validation for creating a user
 */
export const validateCreateUser = [
  validateRequiredFields(["displayName", "email"]),
  validateFieldTypes({displayName: "string", email: "string"}),
  validateStringLength("displayName", 1, 100),
  validateEmail(),
  validateNotEmpty("displayName"),
];

/**
 * Validation for creating a group
 */
export const validateCreateGroup = [
  validateRequiredFields(["name"]),
  validateFieldTypes({name: "string"}),
  validateStringLength("name", 1, 100),
  validateNotEmpty("name"),
];

/**
 * Validation for adding user to group
 */
export const validateAddUserToGroup = [
  validatePathParams(["groupId"]),
  validateRequiredFields(["userId"]),
  validateFieldTypes({userId: "string"}),
  validateStringLength("userId", 1, 100),
];

/**
 * Validation for creating a transaction
 */
export const validateCreateTransaction = [
  validatePathParams(["groupId"]),
  validateRequiredFields(["userId", "amount"]),
  validateFieldTypes({userId: "string", amount: "number"}),
  validateStringLength("userId", 1, 100),
  validateNumericRange("amount", -1000000, 1000000), // Reasonable limits
];
