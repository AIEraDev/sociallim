"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateRequest = exports.changePasswordSchema = exports.updateProfileSchema = exports.loginSchema = exports.registerSchema = void 0;
const joi_1 = __importDefault(require("joi"));
exports.registerSchema = joi_1.default.object({
    email: joi_1.default.string().email().lowercase().trim().required().messages({
        "string.email": "Please provide a valid email address",
        "any.required": "Email is required",
    }),
    password: joi_1.default.string()
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
    firstName: joi_1.default.string().trim().min(1).max(50).messages({
        "string.min": "First name cannot be empty",
        "string.max": "First name must not exceed 50 characters",
    }),
    lastName: joi_1.default.string().trim().min(1).max(50).messages({
        "string.min": "Last name cannot be empty",
        "string.max": "Last name must not exceed 50 characters",
    }),
});
exports.loginSchema = joi_1.default.object({
    email: joi_1.default.string().email().lowercase().trim().required().messages({
        "string.email": "Please provide a valid email address",
        "any.required": "Email is required",
    }),
    password: joi_1.default.string().required().messages({
        "any.required": "Password is required",
    }),
});
exports.updateProfileSchema = joi_1.default.object({
    email: joi_1.default.string().email().lowercase().trim().optional().messages({
        "string.email": "Please provide a valid email address",
    }),
    firstName: joi_1.default.string().trim().min(1).max(50).optional().allow("").messages({
        "string.min": "First name cannot be empty",
        "string.max": "First name must not exceed 50 characters",
    }),
    lastName: joi_1.default.string().trim().min(1).max(50).optional().allow("").messages({
        "string.min": "Last name cannot be empty",
        "string.max": "Last name must not exceed 50 characters",
    }),
});
exports.changePasswordSchema = joi_1.default.object({
    currentPassword: joi_1.default.string().required().messages({
        "any.required": "Current password is required",
    }),
    newPassword: joi_1.default.string()
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
    confirmPassword: joi_1.default.string().valid(joi_1.default.ref("newPassword")).required().messages({
        "any.only": "Password confirmation does not match new password",
        "any.required": "Password confirmation is required",
    }),
});
const validateRequest = (schema) => {
    return (req, res, next) => {
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
        req.body = value;
        next();
    };
};
exports.validateRequest = validateRequest;
//# sourceMappingURL=authValidation.js.map