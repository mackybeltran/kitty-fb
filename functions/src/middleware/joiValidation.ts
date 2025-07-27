
import {
  createUserSchema,
  createGroupSchema,
  addUserToGroupSchema,
  createTransactionSchema,
  groupIdParamSchema,
  userIdParamSchema,
  createValidationMiddleware,
  createParamValidationMiddleware,
} from "../schemas/validationSchemas";

/**
 * JOI VALIDATION MIDDLEWARE
 *
 * This middleware provides Joi-based validation for all API endpoints.
 * It replaces the custom validation middleware with more robust and
 * feature-rich validation using Joi schemas.
 *
 * Benefits over custom validation:
 * - More comprehensive validation rules
 * - Better error messages
 * - Built-in sanitization
 * - Schema reusability
 * - Type safety
 * - Custom validation functions
 */

/**
 * Validation middleware for creating users
 */
export const validateCreateUser = createValidationMiddleware(
  createUserSchema
);

/**
 * Validation middleware for creating groups
 */
export const validateCreateGroup = createValidationMiddleware(
  createGroupSchema
);

/**
 * Validation middleware for adding users to groups
 */
export const validateAddUserToGroup = createValidationMiddleware(
  addUserToGroupSchema
);

/**
 * Validation middleware for creating transactions
 */
export const validateCreateTransaction = createValidationMiddleware(
  createTransactionSchema
);

/**
 * Path parameter validation middleware for group ID
 */
export const validateGroupIdParam = createParamValidationMiddleware(
  groupIdParamSchema
);

/**
 * Path parameter validation middleware for user ID
 */
export const validateUserIdParam = createParamValidationMiddleware(
  userIdParamSchema
);

/**
 * Combined validation middleware for routes with both path params and body
 */
export const validateGroupRoute = [
  validateGroupIdParam,
  validateAddUserToGroup,
];

export const validateTransactionRoute = [
  validateGroupIdParam,
  validateCreateTransaction,
];

/**
 * Generic validation middleware factory for custom schemas
 *
 * @param {Joi.ObjectSchema} schema - The Joi schema to validate against
 * @return {Function} Express middleware function
 *
 * @example
 * const customSchema = Joi.object({
 *   field: Joi.string().required()
 * });
 *
 * app.post('/custom', createValidationMiddleware(customSchema), (req, res) => {
 *   // req.body is now validated and sanitized
 * });
 */
export {createValidationMiddleware, createParamValidationMiddleware};
