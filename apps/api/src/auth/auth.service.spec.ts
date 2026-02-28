import {
  BadRequestException,
  ForbiddenException,
  UnauthorizedException,
} from "@nestjs/common";
import * as bcrypt from "bcryptjs";
import { AuthService } from "./auth.service";

describe("AuthService.deleteMyAccount", () => {
  const jwtService = { sign: jest.fn(() => "token") } as any;

  function makeService() {
    const prisma = {
      user: {
        findUnique: jest.fn(),
        count: jest.fn(),
        delete: jest.fn(),
      },
      invoice: {
        updateMany: jest.fn(),
      },
      $transaction: jest.fn(async (fn: (tx: any) => Promise<unknown>) =>
        fn(prisma),
      ),
    } as any;
    return {
      prisma,
      service: new AuthService(prisma, jwtService),
    };
  }

  it("deletes a non-admin user with valid current password", async () => {
    const { prisma, service } = makeService();
    prisma.user.findUnique.mockResolvedValue({
      id: "u1",
      familyId: "f1",
      role: "ADULT",
      passwordHash: await bcrypt.hash("secret123", 1),
    });
    prisma.invoice.updateMany.mockResolvedValue({ count: 2 });
    prisma.user.delete.mockResolvedValue({ id: "u1" });

    const result = await service.deleteMyAccount("u1", "secret123");

    expect(prisma.invoice.updateMany).toHaveBeenCalledWith({
      where: { ownerUserId: "u1", isPersonal: true },
      data: { isPersonal: false, ownerUserId: null },
    });
    expect(prisma.user.delete).toHaveBeenCalledWith({ where: { id: "u1" } });
    expect(result).toEqual({ message: "Account deleted successfully" });
  });

  it("throws BadRequestException when password is incorrect", async () => {
    const { prisma, service } = makeService();
    prisma.user.findUnique.mockResolvedValue({
      id: "u1",
      familyId: "f1",
      role: "ADULT",
      passwordHash: await bcrypt.hash("secret123", 1),
    });

    await expect(service.deleteMyAccount("u1", "wrong")).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(prisma.user.delete).not.toHaveBeenCalled();
    expect(prisma.invoice.updateMany).not.toHaveBeenCalled();
  });

  it("throws ForbiddenException when deleting the last admin", async () => {
    const { prisma, service } = makeService();
    prisma.user.findUnique.mockResolvedValue({
      id: "u1",
      familyId: "f1",
      role: "ADMIN",
      passwordHash: await bcrypt.hash("secret123", 1),
    });
    prisma.user.count.mockResolvedValue(1);

    await expect(
      service.deleteMyAccount("u1", "secret123"),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(prisma.user.delete).not.toHaveBeenCalled();
    expect(prisma.invoice.updateMany).not.toHaveBeenCalled();
  });

  it("allows admin deletion when another admin exists", async () => {
    const { prisma, service } = makeService();
    prisma.user.findUnique.mockResolvedValue({
      id: "u1",
      familyId: "f1",
      role: "ADMIN",
      passwordHash: await bcrypt.hash("secret123", 1),
    });
    prisma.user.count.mockResolvedValue(2);
    prisma.invoice.updateMany.mockResolvedValue({ count: 0 });
    prisma.user.delete.mockResolvedValue({ id: "u1" });

    await service.deleteMyAccount("u1", "secret123");

    expect(prisma.user.count).toHaveBeenCalledWith({
      where: { familyId: "f1", role: "ADMIN" },
    });
    expect(prisma.user.delete).toHaveBeenCalledWith({ where: { id: "u1" } });
  });
});

describe("AuthService.loginWithPassword 2FA", () => {
  const jwtService = { sign: jest.fn(() => "token") } as any;

  function makeService() {
    const prisma = {
      user: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
    } as any;
    return {
      prisma,
      service: new AuthService(prisma, jwtService),
    };
  }

  it("rejects login when 2FA is enabled but no second factor is provided", async () => {
    const { prisma, service } = makeService();
    prisma.user.findUnique.mockResolvedValue({
      id: "u1",
      username: "admin",
      familyId: "f1",
      role: "ADMIN",
      passwordHash: await bcrypt.hash("secret123", 1),
      twoFactorEnabled: true,
      twoFactorSecret: "JBSWY3DPEHPK3PXP",
      family: { id: "f1", name: "Family" },
    });

    await expect(
      service.loginWithPassword("admin", "secret123"),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(jwtService.sign).not.toHaveBeenCalled();
  });

  it("consumes recovery code and allows login", async () => {
    const { prisma, service } = makeService();
    const user = {
      id: "u1",
      username: "admin",
      name: "Admin",
      avatarUrl: null,
      familyId: "f1",
      role: "ADMIN",
      passwordHash: await bcrypt.hash("secret123", 1),
      twoFactorEnabled: true,
      twoFactorSecret: "JBSWY3DPEHPK3PXP",
      twoFactorRecoveryCodes: ["a1b2c3d4", "e5f6a7b8"],
      family: { id: "f1", name: "Family" },
    };
    prisma.user.findUnique.mockResolvedValueOnce(user);
    prisma.$executeRaw = jest.fn().mockResolvedValue(1);

    const result = await service.loginWithPassword(
      "admin",
      "secret123",
      undefined,
      "a1b2c3d4",
    );

    expect(prisma.$executeRaw).toHaveBeenCalled();
    expect(result.accessToken).toBe("token");
  });
});
