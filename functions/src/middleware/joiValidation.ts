
import {
  createUserSchema,
  createGroupSchema,
  addUserToGroupSchema,
  purchaseBucketsSchema,
  recordConsumptionSchema,
  updateUserBalanceSchema,
  createKittyTransactionSchema,
  groupIdParamSchema,
  userIdParamSchema,
  groupAndUserIdParamSchema,
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
