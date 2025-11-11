"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const prisma_1 = __importDefault(require("../prisma"));
jest.mock("@prisma/client", () => ({
    PrismaClient: jest.fn().mockImplementation(() => ({
        $connect: jest.fn(),
        $disconnect: jest.fn(),
        user: {
            findMany: jest.fn(),
            create: jest.fn(),
        },
    })),
}));
describe("Prisma Configuration", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });
    it("should export a prisma instance", () => {
        expect(prisma_1.default).toBeDefined();
        expect(typeof prisma_1.default).toBe("object");
    });
    it("should have user model available", () => {
        expect(prisma_1.default.user).toBeDefined();
    });
    it("should be able to call user methods", async () => {
        const mockUsers = [{ id: "1", email: "test@example.com", createdAt: new Date(), updatedAt: new Date() }];
        prisma_1.default.user.findMany.mockResolvedValue(mockUsers);
        const users = await prisma_1.default.user.findMany();
        expect(users).toEqual(mockUsers);
        expect(prisma_1.default.user.findMany).toHaveBeenCalled();
    });
    it("should have database connection methods", () => {
        expect(prisma_1.default.$connect).toBeDefined();
        expect(prisma_1.default.$disconnect).toBeDefined();
    });
});
//# sourceMappingURL=prisma.test.js.map