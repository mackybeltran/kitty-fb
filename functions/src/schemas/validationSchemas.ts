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
  isAdmin: Joi.boolean()
    .optional()
    .messages({
      "boolean.base": "isAdmin must be a boolean value",
    }),
});

/**
 * Bucket purchase schema
 */
export const purchaseBucketsSchema = Joi.object({
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
  bucketCount: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .required()
    .messages({
      "number.base": "Bucket count must be a number",
      "number.integer": "Bucket count must be a whole number",
      "number.min": "Bucket count must be at least 1",
      "number.max": "Bucket count cannot exceed 100",
      "any.required": "Bucket count is required",
    }),
  unitsPerBucket: Joi.number()
    .integer()
    .min(1)
    .max(1000)
    .required()
    .messages({
      "number.base": "Units per bucket must be a number",
      "number.integer": "Units per bucket must be a whole number",
      "number.min": "Units per bucket must be at least 1",
      "number.max": "Units per bucket cannot exceed 1000",
      "any.required": "Units per bucket is required",
    }),

});

/**
 * Consumption recording schema
 */
export const recordConsumptionSchema = Joi.object({
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
  units: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .required()
    .messages({
      "number.base": "Units must be a number",
      "number.integer": "Units must be a whole number",
      "number.min": "Units must be at least 1",
      "number.max": "Units cannot exceed 100",
      "any.required": "Units is required",
    }),
});

/**
 * Update user balance schema
 */
export const updateUserBalanceSchema = Joi.object({
  amount: Joi.number()
    .precision(2)
    .min(-10000)
    .max(10000)
    .required()
    .messages({
      "number.base": "Amount must be a number",
      "number.precision": "Amount can have up to 2 decimal places",
      "number.min": "Amount cannot be less than -10000",
      "number.max": "Amount cannot exceed 10000",
      "any.required": "Amount is required",
    }),
  adminUserId: Joi.string()
    .min(1)
    .max(100)
    .trim()
    .required()
    .messages({
      "string.empty": "Admin user ID cannot be empty",
      "string.min": "Admin user ID must be at least 1 character",
      "string.max": "Admin user ID cannot exceed 100 characters",
      "any.required": "Admin user ID is required",
    }),
});

/**
 * Create kitty transaction schema
 */
export const createKittyTransactionSchema = Joi.object({
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
    .min(0.01)
    .max(10000)
    .required()
    .messages({
      "number.base": "Amount must be a number",
      "number.precision": "Amount can have up to 2 decimal places",
      "number.min": "Amount must be greater than 0",
      "number.max": "Amount cannot exceed 10000",
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
 * Combined path parameter schema for group and user IDs
 */
export const groupAndUserIdParamSchema = Joi.object({
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
 * Schema for creating a join request
 */
export const createJoinRequestSchema = Joi.object({
  userId: Joi.string()
    .required()
    .max(100)
    .messages({
      "any.required": "User ID is required",
      "string.empty": "User ID cannot be empty",
      "string.max": "User ID cannot exceed 100 characters",
    }),
  message: Joi.string()
    .max(500)
    .optional()
    .messages({
      "string.max": "Message cannot exceed 500 characters",
    }),
});

/**
 * Schema for approving a join request
 */
export const approveJoinRequestSchema = Joi.object({
  adminUserId: Joi.string()
    .required()
    .max(100)
    .messages({
      "any.required": "Admin user ID is required",
      "string.empty": "Admin user ID cannot be empty",
      "string.max": "Admin user ID cannot exceed 100 characters",
    }),
  reason: Joi.string()
    .max(500)
    .optional()
    .messages({
      "string.max": "Reason cannot exceed 500 characters",
    }),
});

/**
 * Schema for denying a join request
 */
export const denyJoinRequestSchema = Joi.object({
  adminUserId: Joi.string()
    .required()
    .max(100)
    .messages({
      "any.required": "Admin user ID is required",
      "string.empty": "Admin user ID cannot be empty",
      "string.max": "Admin user ID cannot exceed 100 characters",
    }),
  reason: Joi.string()
    .required()
    .max(500)
    .messages({
      "any.required": "Reason for denial is required",
      "string.empty": "Reason for denial cannot be empty",
      "string.max": "Reason cannot exceed 500 characters",
    }),
});

/**
 * Schema for group and request ID parameters
 */
export const groupAndRequestIdParamSchema = Joi.object({
  groupId: Joi.string()
    .required()
    .max(100)
    .messages({
      "any.required": "Group ID is required",
      "string.empty": "Group ID cannot be empty",
      "string.max": "Group ID cannot exceed 100 characters",
    }),
  requestId: Joi.string()
    .required()
    .max(100)
    .messages({
      "any.required": "Request ID is required",
      "string.empty": "Request ID cannot be empty",
      "string.max": "Request ID cannot exceed 100 characters",
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
   * Validates that a number is a reasonable quantity
   * @param {number} value - The number to validate
   * @return {boolean} True if valid quantity, false otherwise
   */
  isValidQuantity: (value: number): boolean => {
    // Check if it's a finite number
    if (!Number.isFinite(value)) {
      return false;
    }

    // Check if it's within reasonable bounds
    if (value < 1 || value > 1000) {
      return false;
    }

    // Check if it's an integer
    if (!Number.isInteger(value)) {
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

export const enhancedPurchaseBucketsSchema = purchaseBucketsSchema.keys({
  bucketCount: purchaseBucketsSchema.extract("bucketCount").custom(
    (value: number, helpers: Joi.CustomHelpers) => {
      if (!customValidations.isValidQuantity(value)) {
        return helpers.error("any.invalid");
      }
      return value;
    },
    "valid-quantity"
  ).messages({
    "any.invalid": "Bucket count is not a valid quantity",
  }),
  unitsPerBucket: purchaseBucketsSchema.extract("unitsPerBucket").custom(
    (value: number, helpers: Joi.CustomHelpers) => {
      if (!customValidations.isValidQuantity(value)) {
        return helpers.error("any.invalid");
      }
      return value;
    },
    "valid-quantity"
  ).messages({
    "any.invalid": "Units per bucket is not a valid quantity",
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
 * QR code generation schema
 */
export const generateQRCodeSchema = Joi.object({
  type: Joi.string()
    .valid("dual-purpose", "onboarding", "consumption")
    .default("dual-purpose")
    .messages({
      "any.only": "Type must be dual-purpose, onboarding, or consumption",
    }),
  size: Joi.number()
    .integer()
    .min(100)
    .max(1000)
    .default(300)
    .messages({
      "number.base": "Size must be a number",
      "number.integer": "Size must be an integer",
      "number.min": "Size must be at least 100",
      "number.max": "Size cannot exceed 1000",
    }),
  includeLogo: Joi.boolean()
    .default(false)
    .messages({
      "boolean.base": "Include logo must be a boolean value",
    }),
});

/**
 * QR code processing schema
 */
export const processQRCodeSchema = Joi.object({
  qrData: Joi.string()
    .min(1)
    .max(2000)
    .trim()
    .required()
    .messages({
      "string.empty": "QR data cannot be empty",
      "string.min": "QR data must be at least 1 character",
      "string.max": "QR data cannot exceed 2000 characters",
      "any.required": "QR data is required",
    }),
  userContext: Joi.object({
    userId: Joi.string()
      .min(1)
      .max(100)
      .trim()
      .optional()
      .messages({
        "string.min": "User ID must be at least 1 character",
        "string.max": "User ID cannot exceed 100 characters",
      }),
    platform: Joi.string()
      .valid("ios", "android", "web")
      .required()
      .messages({
        "string.empty": "Platform cannot be empty",
        "any.only": "Platform must be ios, android, or web",
        "any.required": "Platform is required",
      }),
    appVersion: Joi.string()
      .max(50)
      .trim()
      .optional()
      .messages({
        "string.max": "App version cannot exceed 50 characters",
      }),
    deviceId: Joi.string()
      .max(100)
      .trim()
      .optional()
      .messages({
        "string.max": "Device ID cannot exceed 100 characters",
      }),
  }).required().messages({
    "any.required": "User context is required",
  }),
});

/**
 * Enhanced join request schema with QR context
 */
export const enhancedCreateJoinRequestSchema = createJoinRequestSchema.keys({
  source: Joi.string()
    .valid("qr-code", "manual", "invite")
    .default("manual")
    .messages({
      "any.only": "Source must be qr-code, manual, or invite",
    }),
  qrContext: Joi.object({
    timestamp: Joi.number().optional(),
    deviceInfo: Joi.object({
      platform: Joi.string().valid("ios", "android", "web").optional(),
      appVersion: Joi.string().optional(),
    }).optional(),
  }).optional(),
});

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
