import { ForbiddenException } from "@nestjs/common";
import { UsersService } from "./users.service";

describe("UsersService.remove", () => {
  function makeService() {
    const prisma = {
      user: {
        findFirst: jest.fn(),
        count: jest.fn(),
        delete: jest.fn(),
      },
      invoice: {
        updateMany: jest.fn(),
      },
      $transaction: jest.fn(async (fn: (tx: any) => Promise<unknown>) => fn(prisma)),
    } as any;
    return { prisma, service: new UsersService(prisma) };
  }

  it("converts personal invoices to shared before deleting a user", async () => {
    const { prisma, service } = makeService();
    prisma.user.findFirst.mockResolvedValue({ id: "u1", familyId: "f1", role: "ADULT" });
    prisma.invoice.updateMany.mockResolvedValue({ count: 2 });
    prisma.user.delete.mockResolvedValue({ id: "u1" });

    await service.remove("u1", "f1");

    expect(prisma.invoice.updateMany).toHaveBeenCalledWith({
      where: { ownerUserId: "u1", isPersonal: true },
      data: { isPersonal: false, ownerUserId: null },
    });
    expect(prisma.user.delete).toHaveBeenCalledWith({ where: { id: "u1" } });
  });

  it("prevents deleting the last admin", async () => {
    const { prisma, service } = makeService();
    prisma.user.findFirst.mockResolvedValue({ id: "u1", familyId: "f1", role: "ADMIN" });
    prisma.user.count.mockResolvedValue(1);

    await expect(service.remove("u1", "f1")).rejects.toBeInstanceOf(ForbiddenException);
    expect(prisma.invoice.updateMany).not.toHaveBeenCalled();
  });
});
