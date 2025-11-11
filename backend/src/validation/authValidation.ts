import Joi from "joi";

/**
 * Validation schema for user registration
 */
export const registerSchema = Joi.object({
  email: Joi.string().email().lowercase().trim().required().messages({
    "string.email": "Please provide a valid email address",
    "any.required": "Email is required",
  }),

  password: Joi.string()
    .min(8)
    .max(128)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/)
    .required()
    .messages({
      "string.min": "Password must be at least 8 characters long",
      "string.max": "Password must not exceed 128 characters",
      "string.pattern.base": "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character",
      "any.required": "Password is required",
    }),

  firstName: Joi.string().trim().min(1).max(50).messages({
    "string.min": "First name cannot be empty",
    "string.max": "First name must not exceed 50 characters",
  }),

  lastName: Joi.string().trim().min(1).max(50).messages({
    "string.min": "Last name cannot be empty",
    "string.max": "Last name must not exceed 50 characters",
  }),
});

/**
 * Validation schema for user login
 */
export const loginSchema = Joi.object({
  email: Joi.string().email().lowercase().trim().required().messages({
    "string.email": "Please provide a valid email address",
    "any.required": "Email is required",
  }),

  password: Joi.string().required().messages({
    "any.required": "Password is required",
  }),
});

/**
 * Validation schema for profile update
 */
export const updateProfileSchema = Joi.object({
  email: Joi.string().email().lowercase().trim().optional().messages({
    "string.email": "Please provide a valid email address",
  }),

  firstName: Joi.string().trim().min(1).max(50).optional().allow("").messages({
    "string.min": "First name cannot be empty",
    "string.max": "First name must not exceed 50 characters",
  }),

  lastName: Joi.string().trim().min(1).max(50).optional().allow("").messages({
    "string.min": "Last name cannot be empty",
    "string.max": "Last name must not exceed 50 characters",
  }),
});

/**
 * Validation schema for password change
 */
export const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required().messages({
    "any.required": "Current password is required",
  }),

  newPassword: Joi.string()
    .min(8)
    .max(128)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/)
    .required()
    .messages({
      "string.min": "New password must be at least 8 characters long",
      "string.max": "New password must not exceed 128 characters",
      "string.pattern.base": "New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character",
      "any.required": "New password is required",
    }),

  confirmPassword: Joi.string().valid(Joi.ref("newPassword")).required().messages({
    "any.only": "Password confirmation does not match new password",
    "any.required": "Password confirmation is required",
  }),
});

/**
 * Middleware to validate request body against a Joi schema
 */
export const validateRequest = (schema: Joi.ObjectSchema) => {
  return (req: any, res: any, next: any) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errors = error.details.map((detail) => ({
        field: detail.path.join("."),
        message: detail.message,
      }));

      return res.status(400).json({
        error: "Validation failed",
        message: "Please check your input and try again",
        details: errors,
      });
    }

    // Replace req.body with validated and sanitized data
    req.body = value;
    next();
  };
};
