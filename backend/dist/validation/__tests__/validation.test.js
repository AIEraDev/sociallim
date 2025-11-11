"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const authValidation_1 = require("../authValidation");
const analysisValidation_1 = require("../analysisValidation");
const mockResponse = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};
describe("Validation Schemas", () => {
    describe("Auth Validation", () => {
        describe("registerSchema", () => {
            it("should validate valid registration data", () => {
                const validData = {
                    email: "test@example.com",
                    password: "SecurePass123!",
                    firstName: "John",
                    lastName: "Doe",
                };
                const { error, value } = authValidation_1.registerSchema.validate(validData);
                expect(error).toBeUndefined();
                expect(value).toEqual({
                    email: "test@example.com",
                    password: "SecurePass123!",
                    firstName: "John",
                    lastName: "Doe",
                });
            });
            it("should reject invalid email", () => {
                const invalidData = {
                    email: "invalid-email",
                    password: "SecurePass123!",
                };
                const { error } = authValidation_1.registerSchema.validate(invalidData);
                expect(error).toBeDefined();
                expect(error?.details[0].message).toContain("valid email address");
            });
            it("should reject weak password", () => {
                const invalidData = {
                    email: "test@example.com",
                    password: "weak",
                };
                const { error } = authValidation_1.registerSchema.validate(invalidData);
                expect(error).toBeDefined();
                expect(error?.details[0].message).toContain("at least 8 characters");
            });
            it("should require password complexity", () => {
                const invalidData = {
                    email: "test@example.com",
                    password: "simplepassword",
                };
                const { error } = authValidation_1.registerSchema.validate(invalidData);
                expect(error).toBeDefined();
                expect(error?.details[0].message).toContain("uppercase letter");
            });
            it("should normalize email to lowercase", () => {
                const data = {
                    email: "TEST@EXAMPLE.COM",
                    password: "SecurePass123!",
                };
                const { value } = authValidation_1.registerSchema.validate(data);
                expect(value.email).toBe("test@example.com");
            });
            it("should trim whitespace from names", () => {
                const data = {
                    email: "test@example.com",
                    password: "SecurePass123!",
                    firstName: "  John  ",
                    lastName: "  Doe  ",
                };
                const { value } = authValidation_1.registerSchema.validate(data);
                expect(value.firstName).toBe("John");
                expect(value.lastName).toBe("Doe");
            });
        });
        describe("loginSchema", () => {
            it("should validate valid login data", () => {
                const validData = {
                    email: "test@example.com",
                    password: "password123",
                };
                const { error, value } = authValidation_1.loginSchema.validate(validData);
                expect(error).toBeUndefined();
                expect(value).toEqual({
                    email: "test@example.com",
                    password: "password123",
                });
            });
            it("should require email and password", () => {
                const invalidData = {};
                const { error } = authValidation_1.loginSchema.validate(invalidData);
                expect(error).toBeDefined();
                expect(error?.details).toHaveLength(1);
            });
        });
        describe("changePasswordSchema", () => {
            it("should validate password change data", () => {
                const validData = {
                    currentPassword: "oldpass",
                    newPassword: "NewSecurePass123!",
                    confirmPassword: "NewSecurePass123!",
                };
                const { error } = authValidation_1.changePasswordSchema.validate(validData);
                expect(error).toBeUndefined();
            });
            it("should reject mismatched password confirmation", () => {
                const invalidData = {
                    currentPassword: "oldpass",
                    newPassword: "NewSecurePass123!",
                    confirmPassword: "DifferentPass123!",
                };
                const { error } = authValidation_1.changePasswordSchema.validate(invalidData);
                expect(error).toBeDefined();
                expect(error?.details[0].message).toContain("does not match");
            });
        });
    });
    describe("Analysis Validation", () => {
        describe("startAnalysisSchema", () => {
            it("should validate valid analysis start data", () => {
                const validData = {
                    postId: "post123",
                    options: {
                        includeSpam: false,
                        maxComments: 500,
                        analysisDepth: "detailed",
                    },
                };
                const { error, value } = analysisValidation_1.startAnalysisSchema.validate(validData);
                expect(error).toBeUndefined();
                expect(value.postId).toBe("post123");
                expect(value.options.maxComments).toBe(500);
            });
            it("should apply default options", () => {
                const data = {
                    postId: "post123",
                    options: {},
                };
                const { value } = analysisValidation_1.startAnalysisSchema.validate(data);
                expect(value.options?.includeSpam).toBe(false);
                expect(value.options?.maxComments).toBe(1000);
                expect(value.options?.analysisDepth).toBe("detailed");
            });
            it("should reject invalid analysis depth", () => {
                const invalidData = {
                    postId: "post123",
                    options: {
                        analysisDepth: "invalid",
                    },
                };
                const { error } = analysisValidation_1.startAnalysisSchema.validate(invalidData);
                expect(error).toBeDefined();
                expect(error?.details[0].message).toContain("must be one of");
            });
            it("should limit max comments", () => {
                const invalidData = {
                    postId: "post123",
                    options: {
                        maxComments: 50000,
                    },
                };
                const { error } = analysisValidation_1.startAnalysisSchema.validate(invalidData);
                expect(error).toBeDefined();
                expect(error?.details[0].message).toContain("less than or equal to 10000");
            });
        });
        describe("exportAnalysisSchema", () => {
            it("should validate valid export data", () => {
                const validData = {
                    analysisId: "analysis123",
                    format: "pdf",
                    options: {
                        includeRawData: true,
                        includeCharts: false,
                    },
                };
                const { error, value } = analysisValidation_1.exportAnalysisSchema.validate(validData);
                expect(error).toBeUndefined();
                expect(value.format).toBe("pdf");
            });
            it("should reject invalid format", () => {
                const invalidData = {
                    analysisId: "analysis123",
                    format: "invalid",
                };
                const { error } = analysisValidation_1.exportAnalysisSchema.validate(invalidData);
                expect(error).toBeDefined();
                expect(error?.details[0].message).toContain("must be one of");
            });
        });
        describe("compareAnalysisSchema", () => {
            it("should validate comparison data", () => {
                const validData = {
                    analysisIds: ["analysis1", "analysis2", "analysis3"],
                    comparisonType: "sentiment",
                };
                const { error, value } = analysisValidation_1.compareAnalysisSchema.validate(validData);
                expect(error).toBeUndefined();
                expect(value.analysisIds).toHaveLength(3);
            });
            it("should require at least 2 analyses", () => {
                const invalidData = {
                    analysisIds: ["analysis1"],
                };
                const { error } = analysisValidation_1.compareAnalysisSchema.validate(invalidData);
                expect(error).toBeDefined();
                expect(error?.details[0].message).toContain("At least 2");
            });
            it("should reject duplicate analysis IDs", () => {
                const invalidData = {
                    analysisIds: ["analysis1", "analysis1", "analysis2"],
                };
                const { error } = analysisValidation_1.compareAnalysisSchema.validate(invalidData);
                expect(error).toBeDefined();
                expect(error?.details[0].message).toContain("Duplicate");
            });
            it("should limit maximum analyses", () => {
                const invalidData = {
                    analysisIds: Array.from({ length: 15 }, (_, i) => `analysis${i}`),
                };
                const { error } = analysisValidation_1.compareAnalysisSchema.validate(invalidData);
                expect(error).toBeDefined();
                expect(error?.details[0].message).toContain("Cannot compare more than 10");
            });
        });
    });
    describe("Validation Middleware", () => {
        let req;
        let res;
        let next;
        beforeEach(() => {
            req = {};
            res = mockResponse();
            next = jest.fn();
        });
        describe("validateRequest", () => {
            it("should pass valid data through", () => {
                req.body = {
                    email: "test@example.com",
                    password: "SecurePass123!",
                };
                const middleware = (0, authValidation_1.validateRequest)(authValidation_1.loginSchema);
                middleware(req, res, next);
                expect(next).toHaveBeenCalledWith();
                expect(req.body.email).toBe("test@example.com");
            });
            it("should return validation error for invalid data", () => {
                req.body = {
                    email: "invalid-email",
                    password: "",
                };
                const middleware = (0, authValidation_1.validateRequest)(authValidation_1.loginSchema);
                middleware(req, res, next);
                expect(res.status).toHaveBeenCalledWith(400);
                expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                    error: "Validation failed",
                    message: "Please check your input and try again",
                    details: expect.arrayContaining([
                        expect.objectContaining({
                            field: "email",
                            message: expect.stringContaining("valid email"),
                        }),
                    ]),
                }));
                expect(next).not.toHaveBeenCalled();
            });
            it("should strip unknown fields", () => {
                req.body = {
                    email: "test@example.com",
                    password: "SecurePass123!",
                    unknownField: "should be removed",
                };
                const middleware = (0, authValidation_1.validateRequest)(authValidation_1.loginSchema);
                middleware(req, res, next);
                expect(next).toHaveBeenCalledWith();
                expect(req.body).not.toHaveProperty("unknownField");
            });
        });
        describe("validateQuery", () => {
            it("should validate query parameters", () => {
                req.query = {
                    page: "1",
                    limit: "20",
                };
                const schema = require("joi").object({
                    page: require("joi").number().integer().min(1).default(1),
                    limit: require("joi").number().integer().min(1).max(100).default(20),
                });
                const middleware = (0, analysisValidation_1.validateQuery)(schema);
                middleware(req, res, next);
                expect(next).toHaveBeenCalledWith();
                expect(req.query.page).toBe(1);
                expect(req.query.limit).toBe(20);
            });
            it("should return error for invalid query parameters", () => {
                req.query = {
                    page: "invalid",
                };
                const schema = require("joi").object({
                    page: require("joi").number().integer().min(1).required(),
                });
                const middleware = (0, analysisValidation_1.validateQuery)(schema);
                middleware(req, res, next);
                expect(res.status).toHaveBeenCalledWith(400);
                expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                    error: "Validation failed",
                    message: "Invalid query parameters",
                }));
            });
        });
        describe("validateParams", () => {
            it("should validate URL parameters", () => {
                req.params = {
                    id: "valid-id-123",
                };
                const middleware = (0, analysisValidation_1.validateParams)(analysisValidation_1.idParamSchema);
                middleware(req, res, next);
                expect(next).toHaveBeenCalledWith();
                expect(req.params.id).toBe("valid-id-123");
            });
            it("should return error for invalid parameters", () => {
                req.params = {
                    id: "",
                };
                const middleware = (0, analysisValidation_1.validateParams)(analysisValidation_1.idParamSchema);
                middleware(req, res, next);
                expect(res.status).toHaveBeenCalledWith(400);
                expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                    error: "Validation failed",
                    message: "Invalid URL parameters",
                }));
            });
        });
    });
});
//# sourceMappingURL=validation.test.js.map