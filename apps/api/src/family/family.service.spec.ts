import { FamilyService } from "./family.service";

describe("FamilyService bulk removals", () => {
  function makeService() {
    const prisma = {
      family: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
    } as any;
    return { prisma, service: new FamilyService(prisma) };
  }

  it("removeCategories removes all provided names in one update", async () => {
    const { prisma, service } = makeService();
    prisma.family.findUnique.mockResolvedValue({
      id: "f1",
      categories: ["Food", "Rent", "Internet"],
      paymentMethods: [],
    });
    prisma.family.update.mockResolvedValue({
      categories: ["Rent"],
    });

    const result = await service.removeCategories("f1", ["Food", "Internet"]);

    expect(prisma.family.update).toHaveBeenCalledWith({
      where: { id: "f1" },
      data: { categories: ["Rent"] },
    });
    expect(result).toEqual(["Rent"]);
  });

  it("removePaymentMethods removes all provided names in one update", async () => {
    const { prisma, service } = makeService();
    prisma.family.findUnique.mockResolvedValue({
      id: "f1",
      categories: [],
      paymentMethods: ["Card", "Cash", "Vipps"],
    });
    prisma.family.update.mockResolvedValue({
      paymentMethods: ["Card"],
    });

    const result = await service.removePaymentMethods("f1", ["Cash", "Vipps"]);

    expect(prisma.family.update).toHaveBeenCalledWith({
      where: { id: "f1" },
      data: { paymentMethods: ["Card"] },
    });
    expect(result).toEqual(["Card"]);
  });
});
