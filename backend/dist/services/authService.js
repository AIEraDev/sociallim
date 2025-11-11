"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const database_1 = require("../config/database");
const environment_1 = require("../config/environment");
const prismaCache_1 = require("../utils/prismaCache");
function withCacheStrategy(args, cacheStrategy) {
    if (process.env.DATABASE_URL?.includes("prisma+")) {
        return { ...args, cacheStrategy };
    }
    return args;
}
const emailService_1 = require("./emailService");
class AuthService {
    static async register(data) {
        const { email, password, firstName, lastName } = data;
        const existingUser = await database_1.prisma.user.findUnique(withCacheStrategy({
            where: { email: email.toLowerCase() },
        }, (0, prismaCache_1.createEnvCacheStrategy)(300)));
        console.log(existingUser);
        if (existingUser) {
            throw new Error("User with this email already exists");
        }
        const hashedPassword = await bcryptjs_1.default.hash(password, this.SALT_ROUNDS);
        const verificationToken = this.generateVerificationToken();
        const user = await database_1.prisma.user.create({
            data: {
                email: email.toLowerCase(),
                password: hashedPassword,
                firstName,
                lastName,
                emailVerified: false,
                emailVerificationToken: verificationToken,
                emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
            },
        });
        const limitedToken = this.generateLimitedToken({
            userId: user.id,
            email: user.email,
            emailVerified: false,
        });
        await this.storeLimitedUserSession(user.id, limitedToken);
        const { password: _, emailVerificationToken: __, ...userWithoutPassword } = user;
        return {
            user: userWithoutPassword,
            verificationToken,
            limitedToken,
        };
    }
    static async login(data) {
        const { email, password } = data;
        const user = await database_1.prisma.user.findUnique(withCacheStrategy({
            where: { email: email.toLowerCase() },
        }, (0, prismaCache_1.createEnvCacheStrategy)(300)));
        if (!user) {
            throw new Error("Invalid email or password");
        }
        if (!user.emailVerified) {
            try {
                const recentlySent = user.emailVerificationExpires && user.emailVerificationExpires > new Date(Date.now() - 5 * 60 * 1000);
                if (!recentlySent) {
                    const verificationToken = this.generateVerificationToken();
                    await database_1.prisma.user.update({
                        where: { id: user.id },
                        data: {
                            emailVerificationToken: verificationToken,
                            emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
                        },
                    });
                    await emailService_1.EmailService.sendVerificationEmail(user.email, verificationToken);
                    throw new Error("Please verify your email address before logging in. We've sent a new verification link to your inbox.");
                }
                else {
                    throw new Error("Please verify your email address before logging in. Check your inbox for the verification link (sent recently).");
                }
            }
            catch (emailError) {
                console.error("Failed to resend verification email:", emailError);
                throw new Error("Please verify your email address before logging in. Check your inbox for the verification link, or contact support if you need help.");
            }
        }
        const isPasswordValid = await bcryptjs_1.default.compare(password, user.password);
        if (!isPasswordValid) {
            throw new Error("Invalid email or password");
        }
        if (!user.emailVerified) {
            throw new Error("Please verify your email address before logging in. Check your inbox for the verification link.");
        }
        await database_1.prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() },
        });
        const token = this.generateToken({
            userId: user.id,
            email: user.email,
        });
        await this.storeUserSession(user.id, token);
        const { password: _, ...userWithoutPassword } = user;
        return {
            user: userWithoutPassword,
            token,
        };
    }
    static async verifyToken(token) {
        try {
            const decoded = jsonwebtoken_1.default.verify(token, environment_1.config.jwt.secret);
            const session = await this.getSessionByToken(token);
            if (!session || session.userId !== decoded.userId) {
                return null;
            }
            const user = await database_1.prisma.user.findUnique(withCacheStrategy({
                where: { id: decoded.userId },
            }, prismaCache_1.CommonCacheConfigs.userProfile()));
            return user;
        }
        catch (error) {
            return null;
        }
    }
    static async logout(userId) {
        await this.removeUserSession(userId);
    }
    static async getUserProfile(userId) {
        const user = await database_1.prisma.user.findUnique({
            where: { id: userId },
        });
        if (!user) {
            return null;
        }
        const { password: _, ...userWithoutPassword } = user;
        return userWithoutPassword;
    }
    static async updateProfile(userId, data) {
        if (data.email) {
            const existingUser = await database_1.prisma.user.findFirst({
                where: {
                    email: data.email.toLowerCase(),
                    NOT: { id: userId },
                },
            });
            if (existingUser) {
                throw new Error("Email is already taken");
            }
        }
        const updatedUser = await database_1.prisma.user.update({
            where: { id: userId },
            data: {
                ...data,
                email: data.email?.toLowerCase(),
                updatedAt: new Date(),
            },
        });
        const { password: _, ...userWithoutPassword } = updatedUser;
        return userWithoutPassword;
    }
    static async changePassword(userId, currentPassword, newPassword) {
        const user = await database_1.prisma.user.findUnique({
            where: { id: userId },
        });
        if (!user) {
            throw new Error("User not found");
        }
        const isCurrentPasswordValid = await bcryptjs_1.default.compare(currentPassword, user.password);
        if (!isCurrentPasswordValid) {
            throw new Error("Current password is incorrect");
        }
        const hashedNewPassword = await bcryptjs_1.default.hash(newPassword, this.SALT_ROUNDS);
        await database_1.prisma.user.update({
            where: { id: userId },
            data: {
                password: hashedNewPassword,
                updatedAt: new Date(),
            },
        });
        await this.logout(userId);
    }
    static generateToken(payload) {
        return jsonwebtoken_1.default.sign(payload, environment_1.config.jwt.secret, {
            expiresIn: environment_1.config.jwt.expiresIn,
        });
    }
    static generateLimitedToken(payload) {
        return jsonwebtoken_1.default.sign({
            ...payload,
            type: "limited_access",
            scope: ["profile:read", "email:resend"],
        }, environment_1.config.jwt.secret, { expiresIn: "24h" });
    }
    static generateVerificationToken() {
        return jsonwebtoken_1.default.sign({
            type: "email_verification",
            timestamp: Date.now(),
            random: Math.random().toString(36).substring(2),
        }, environment_1.config.jwt.secret, { expiresIn: "24h" });
    }
    static async storeUserSession(userId, token) {
        try {
            const expiresAt = new Date(Date.now() + this.TOKEN_EXPIRATION_SECONDS * 1000);
            await database_1.prisma.userSession.deleteMany({
                where: { userId },
            });
            await database_1.prisma.userSession.create(withCacheStrategy({
                data: {
                    token,
                    userId,
                    expiresAt,
                },
            }, (0, prismaCache_1.createEnvCacheStrategy)(this.TOKEN_EXPIRATION_SECONDS)));
        }
        catch (error) {
            console.error("Failed to store user session:", error);
        }
    }
    static async storeLimitedUserSession(userId, token) {
        try {
            const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
            await database_1.prisma.userSession.deleteMany({
                where: { userId },
            });
            await database_1.prisma.userSession.create(withCacheStrategy({
                data: {
                    token,
                    userId,
                    expiresAt,
                },
            }, (0, prismaCache_1.createEnvCacheStrategy)(24 * 60 * 60)));
        }
        catch (error) {
            console.error("Failed to store limited user session:", error);
        }
    }
    static async getSessionByToken(token) {
        try {
            const session = await database_1.prisma.userSession.findUnique(withCacheStrategy({
                where: {
                    token,
                },
                select: {
                    userId: true,
                    expiresAt: true,
                },
            }, prismaCache_1.CommonCacheConfigs.authSession()));
            if (!session || session.expiresAt <= new Date()) {
                return null;
            }
            return session;
        }
        catch (error) {
            console.error("Failed to get session by token:", error);
            return null;
        }
    }
    static async removeUserSession(userId) {
        try {
            await database_1.prisma.userSession.deleteMany({
                where: { userId },
            });
        }
        catch (error) {
            console.error("Failed to remove user session:", error);
        }
    }
    static async getUserSession(userId) {
        try {
            const session = await database_1.prisma.userSession.findFirst(withCacheStrategy({
                where: {
                    userId,
                    expiresAt: {
                        gt: new Date(),
                    },
                },
            }, prismaCache_1.CommonCacheConfigs.authSession()));
            return session;
        }
        catch (error) {
            console.error("Failed to get user session:", error);
            return null;
        }
    }
    static async cleanupExpiredSessions() {
        try {
            await database_1.prisma.userSession.deleteMany({
                where: {
                    expiresAt: {
                        lt: new Date(),
                    },
                },
            });
        }
        catch (error) {
            console.error("Failed to cleanup expired sessions:", error);
        }
    }
    static async verifyEmail(token) {
        const user = await database_1.prisma.user.findFirst({
            where: {
                emailVerificationToken: token,
                emailVerificationExpires: {
                    gt: new Date(),
                },
            },
        });
        if (!user) {
            throw new Error("Invalid or expired verification token");
        }
        const updatedUser = await database_1.prisma.user.update({
            where: { id: user.id },
            data: {
                emailVerified: true,
                emailVerificationToken: null,
                emailVerificationExpires: null,
                updatedAt: new Date(),
            },
        });
        const jwtToken = this.generateToken({
            userId: updatedUser.id,
            email: updatedUser.email,
        });
        await this.storeUserSession(updatedUser.id, jwtToken);
        const { EmailService } = await Promise.resolve().then(() => __importStar(require("./emailService")));
        EmailService.sendWelcomeEmail(updatedUser.email, updatedUser.firstName).catch((error) => {
            console.error("Failed to send welcome email:", error);
        });
        const { password: _, ...userWithoutPassword } = updatedUser;
        return {
            user: userWithoutPassword,
            token: jwtToken,
        };
    }
    static async resendEmailVerification(email) {
        const user = await database_1.prisma.user.findUnique({
            where: { email: email.toLowerCase() },
        });
        if (!user) {
            throw new Error("User not found");
        }
        if (user.emailVerified) {
            throw new Error("Email is already verified");
        }
        const verificationToken = this.generateVerificationToken();
        await database_1.prisma.user.update({
            where: { id: user.id },
            data: {
                emailVerificationToken: verificationToken,
                emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
                updatedAt: new Date(),
            },
        });
        return verificationToken;
    }
    static validatePassword(password) {
        const errors = [];
        if (password.length < 8) {
            errors.push("Password must be at least 8 characters long");
        }
        if (!/[A-Z]/.test(password)) {
            errors.push("Password must contain at least one uppercase letter");
        }
        if (!/[a-z]/.test(password)) {
            errors.push("Password must contain at least one lowercase letter");
        }
        if (!/\d/.test(password)) {
            errors.push("Password must contain at least one number");
        }
        if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
            errors.push("Password must contain at least one special character");
        }
        return {
            isValid: errors.length === 0,
            errors,
        };
    }
}
exports.AuthService = AuthService;
AuthService.SALT_ROUNDS = 12;
AuthService.TOKEN_EXPIRATION_SECONDS = 7 * 24 * 60 * 60;
//# sourceMappingURL=authService.js.map