
import {
  createUserSchema,
  createGroupSchema,
  addUserToGroupSchema,
  purchaseBucketsSchema,
  recordConsumptionSchema,
  updateUserBalanceSchema,
  createKittyTransactionSchema,
  createJoinRequestSchema,
  approveJoinRequestSchema,
  denyJoinRequestSchema,
  groupIdParamSchema,
  userIdParamSchema,
  groupAndUserIdParamSchema,
  groupAndRequestIdParamSchema,
  generateQRCodeSchema,
  processQRCodeSchema,
  enhancedCreateJoinRequestSchema,
  createValidationMiddleware,
  createParamValidationMiddleware,
} from "../schemas/validationSchemas";

/**
 * Joi Validation Middleware
 *
 * This file exports pre-configured validation middleware for each API endpoint.
 * Each middleware function validates request bodies or path parameters
 * using Joi schemas and provides consistent error handling.
 */

// User creation validation
export const validateCreateUser = createValidationMiddleware(createUserSchema);

// Group creation validation
export const validateCreateGroup =
createValidationMiddleware(createGroupSchema);

// Add user to group validation
export const validateGroupRoute =
createValidationMiddleware(addUserToGroupSchema);

// Bucket purchase validation
export const validateBucketPurchase = createValidationMiddleware(
  purchaseBucketsSchema
);

// Consumption recording validation
export const validateConsumption = createValidationMiddleware(
  recordConsumptionSchema
);

// Update user balance validation
export const validateUpdateBalance = createValidationMiddleware(
  updateUserBalanceSchema
);

// Create kitty transaction validation
export const validateKittyTransaction = createValidationMiddleware(
  createKittyTransactionSchema
);

// Join request validation
export const validateCreateJoinRequest = createValidationMiddleware(
  createJoinRequestSchema
);

export const validateEnhancedCreateJoinRequest = createValidationMiddleware(
  enhancedCreateJoinRequestSchema
);

export const validateApproveJoinRequest = createValidationMiddleware(
  approveJoinRequestSchema
);

export const validateDenyJoinRequest = createValidationMiddleware(
  denyJoinRequestSchema
);

// QR code validation
export const validateGenerateQRCode = createValidationMiddleware(
  generateQRCodeSchema
);

export const validateProcessQRCode = createValidationMiddleware(
  processQRCodeSchema
);

// Path parameter validations
export const validateGroupIdParam = createParamValidationMiddleware(
  groupIdParamSchema
);
export const validateUserIdParam = createParamValidationMiddleware(
  userIdParamSchema
);
export const validateGroupAndUserIdParam = createParamValidationMiddleware(
  groupAndUserIdParamSchema
);
export const validateGroupAndRequestIdParam = createParamValidationMiddleware(
  groupAndRequestIdParamSchema
);
