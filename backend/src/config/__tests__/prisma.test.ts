import prisma from "../prisma";

// Mock PrismaClient for testing
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
    expect(prisma).toBeDefined();
    expect(typeof prisma).toBe("object");
  });

  it("should have user model available", () => {
    expect(prisma.user).toBeDefined();
  });

  it("should be able to call user methods", async () => {
    const mockUsers = [{ id: "1", email: "test@example.com", createdAt: new Date(), updatedAt: new Date() }];

    (prisma.user.findMany as jest.Mock).mockResolvedValue(mockUsers);

    const users = await prisma.user.findMany();
    expect(users).toEqual(mockUsers);
    expect(prisma.user.findMany).toHaveBeenCalled();
  });

  it("should have database connection methods", () => {
    expect(prisma.$connect).toBeDefined();
    expect(prisma.$disconnect).toBeDefined();
  });
});
