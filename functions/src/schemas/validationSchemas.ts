import * as Joi from "joi";

/**
 * VALIDATION SCHEMAS
 *
 * This file contains all Joi validation schemas for the API endpoints.
 * These schemas provide robust input validation with clear error messages
 * and type safety.
 *
 * Benefits of using Joi:
 * - Comprehensive validation rules
 * - Clear, descriptive error messages
 * - Schema reusability
 * - Type safety with TypeScript
 * - Built-in sanitization
 * - Custom validation functions
 */

/**
 * User creation schema
 */
export const createUserSchema = Joi.object({
  displayName: Joi.string()
    .min(1)
    .max(100)
    .trim()
    .required()
    .messages({
      "string.empty": "Display name cannot be empty",
      "string.min": "Display name must be at least 1 character",
      "string.max": "Display name cannot exceed 100 characters",
      "any.required": "Display name is required",
    }),
  email: Joi.string()
    .email({tlds: {allow: false}})
    .max(255)
    .trim()
    .lowercase()
    .required()
    .messages({
      "string.email": "Please provide a valid email address",
      "string.max": "Email cannot exceed 255 characters",
      "any.required": "Email is required",
    }),
});

/**
 * Group creation schema
 */
export const createGroupSchema = Joi.object({
  name: Joi.string()
    .min(1)
    .max(100)
    .trim()
    .required()
    .messages({
      "string.empty": "Group name cannot be empty",
      "string.min": "Group name must be at least 1 character",
      "string.max": "Group name cannot exceed 100 characters",
      "any.required": "Group name is required",
    }),
});

/**
 * Add user to group schema
 */
export const addUserToGroupSchema = Joi.object({
  userId: Joi.string()
    .min(1)
    .max(100)
    .trim()
    .required()
    .messages({
      "string.empty": "User ID cannot be empty",
      "string.min": "User ID must be at least 1 character",
      "string.max": "User ID cannot exceed 100 characters",
      "any.required": "User ID is required",
    }),
});

/**
 * Transaction creation schema
 */
export const createTransactionSchema = Joi.object({
  userId: Joi.string()
    .min(1)
    .max(100)
    .trim()
    .required()
    .messages({
      "string.empty": "User ID cannot be empty",
      "string.min": "User ID must be at least 1 character",
      "string.max": "User ID cannot exceed 100 characters",
      "any.required": "User ID is required",
    }),
  amount: Joi.number()
    .precision(2)
    .min(-1000000)
    .max(1000000)
    .required()
    .messages({
      "number.base": "Amount must be a number",
      "number.min": "Amount cannot be less than -1,000,000",
      "number.max": "Amount cannot exceed 1,000,000",
      "number.precision": "Amount can have up to 2 decimal places",
      "any.required": "Amount is required",
    }),
  comment: Joi.string()
    .max(500)
    .trim()
    .optional()
    .allow("")
    .messages({
      "string.max": "Comment cannot exceed 500 characters",
    }),
});

/**
 * Path parameter schemas
 */
export const groupIdParamSchema = Joi.object({
  groupId: Joi.string()
    .min(1)
    .max(100)
    .trim()
    .required()
    .messages({
      "string.empty": "Group ID cannot be empty",
      "string.min": "Group ID must be at least 1 character",
      "string.max": "Group ID cannot exceed 100 characters",
      "any.required": "Group ID is required",
    }),
});

export const userIdParamSchema = Joi.object({
  userId: Joi.string()
    .min(1)
    .max(100)
    .trim()
    .required()
    .messages({
      "string.empty": "User ID cannot be empty",
      "string.min": "User ID must be at least 1 character",
      "string.max": "User ID cannot exceed 100 characters",
      "any.required": "User ID is required",
    }),
});

/**
 * Custom validation functions
 */
export const customValidations = {
  /**
   * Validates that a string is a valid Firebase document ID
   * @param {string} value - The string to validate
   * @return {boolean} True if valid Firebase ID, false otherwise
   */
  isValidFirebaseId: (value: string): boolean => {
    // Firebase document IDs must be 1-1500 characters and can't contain:
    // - Forward slashes (/)
    // - Periods (.)
    // - Double periods (..)
    // - Empty strings
    if (!value || value.length === 0 || value.length > 1500) {
      return false;
    }

    // Check for invalid characters
    if (value.includes("/") || value.includes("..")) {
      return false;
    }

    // Check for reserved names
    const reservedNames = ["__.*__"];
    if (reservedNames.some((name) => value.match(name))) {
      return false;
    }

    return true;
  },

  /**
   * Validates that a number is a reasonable currency amount
   * @param {number} value - The number to validate
   * @return {boolean} True if valid currency amount, false otherwise
   */
  isValidCurrencyAmount: (value: number): boolean => {
    // Check if it's a finite number
    if (!Number.isFinite(value)) {
      return false;
    }

    // Check if it's within reasonable bounds
    if (value < -1000000 || value > 1000000) {
      return false;
    }

    // Check if it has reasonable decimal places (max 2)
    const decimalPlaces = value.toString().split(".")[1]?.length || 0;
    if (decimalPlaces > 2) {
      return false;
    }

    return true;
  },
};

/**
 * Enhanced schemas with custom validations
 */
export const enhancedCreateUserSchema = createUserSchema.keys({
  displayName: createUserSchema.extract("displayName").custom(
    (value: string, helpers: Joi.CustomHelpers) => {
      if (!customValidations.isValidFirebaseId(value)) {
        return helpers.error("any.invalid");
      }
      return value;
    },
    "valid-firebase-id"
  ).messages({
    "any.invalid": "Display name contains invalid characters",
  }),
});

export const enhancedCreateTransactionSchema = createTransactionSchema.keys({
  amount: createTransactionSchema.extract("amount").custom(
    (value: number, helpers: Joi.CustomHelpers) => {
      if (!customValidations.isValidCurrencyAmount(value)) {
        return helpers.error("any.invalid");
      }
      return value;
    },
    "valid-currency-amount"
  ).messages({
    "any.invalid": "Amount is not a valid currency value",
  }),
});

/**
 * Schema validation middleware factory
 * @param {Joi.ObjectSchema} schema - The Joi schema to validate against
 * @return {Function} Express middleware function
 */
export const createValidationMiddleware = (schema: Joi.ObjectSchema) => {
  return (req: any, res: any, next: any) => {
    const {error, value} = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errorMessages = error.details.map(
        (detail: Joi.ValidationErrorItem) => detail.message
      );
      return res.status(400).json({
        error: "Validation failed",
        details: errorMessages,
        statusCode: 400,
      });
    }

    // Replace request body with validated and sanitized data
    req.body = value;
    next();
  };
};

/**
 * Path parameter validation middleware factory
 * @param {Joi.ObjectSchema} schema - The Joi schema to validate against
 * @return {Function} Express middleware function
 */
export const createParamValidationMiddleware = (schema: Joi.ObjectSchema) => {
  return (req: any, res: any, next: any) => {
    const {error, value} = schema.validate(req.params, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errorMessages = error.details.map(
        (detail: Joi.ValidationErrorItem) => detail.message
      );
      return res.status(400).json({
        error: "Invalid path parameters",
        details: errorMessages,
        statusCode: 400,
      });
    }

    // Replace request params with validated data
    req.params = value;
    next();
  };
};
