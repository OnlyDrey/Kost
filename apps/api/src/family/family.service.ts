import { Injectable, NotFoundException, ConflictException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class FamilyService {
  constructor(private prisma: PrismaService) {}

  private async getFamily(familyId: string) {
    const family = await this.prisma.family.findUnique({ where: { id: familyId } });
    if (!family) throw new NotFoundException("Family not found");
    return family;
  }

  async getCategories(familyId: string): Promise<string[]> {
    const family = await this.getFamily(familyId);
    return family.categories;
  }

  async addCategory(familyId: string, name: string): Promise<string[]> {
    const family = await this.getFamily(familyId);
    if (family.categories.includes(name)) return family.categories;
    const updated = await this.prisma.family.update({
      where: { id: familyId },
      data: { categories: { push: name } },
    });
    return updated.categories;
  }

  async removeCategory(familyId: string, name: string): Promise<string[]> {
    const family = await this.getFamily(familyId);
    const updated = await this.prisma.family.update({
      where: { id: familyId },
      data: { categories: family.categories.filter((c) => c !== name) },
    });
    return updated.categories;
  }

  async getPaymentMethods(familyId: string): Promise<string[]> {
    const family = await this.getFamily(familyId);
    return family.paymentMethods;
  }

  async addPaymentMethod(familyId: string, name: string): Promise<string[]> {
    const family = await this.getFamily(familyId);
    if (family.paymentMethods.includes(name)) return family.paymentMethods;
    const updated = await this.prisma.family.update({
      where: { id: familyId },
      data: { paymentMethods: { push: name } },
    });
    return updated.paymentMethods;
  }

  async removePaymentMethod(familyId: string, name: string): Promise<string[]> {
    const family = await this.getFamily(familyId);
    const updated = await this.prisma.family.update({
      where: { id: familyId },
      data: { paymentMethods: family.paymentMethods.filter((m) => m !== name) },
    });
    return updated.paymentMethods;
  }

  async getCurrency(familyId: string): Promise<string> {
    const family = await this.getFamily(familyId);
    return (family as any).currency ?? "NOK";
  }

  async updateCurrency(familyId: string, currency: string): Promise<string> {
    await this.getFamily(familyId);
    const updated = await this.prisma.family.update({
      where: { id: familyId },
      data: { currency } as any,
    });
    return (updated as any).currency;
  }

  async getVendors(familyId: string) {
    return (this.prisma as any).vendor.findMany({
      where: { familyId },
      orderBy: { name: "asc" },
    });
  }

  async addVendor(familyId: string, name: string, logoUrl?: string) {
    const existing = await (this.prisma as any).vendor.findFirst({
      where: { familyId, name },
    });
    if (existing) {
      if (logoUrl !== undefined) {
        return (this.prisma as any).vendor.update({
          where: { id: existing.id },
          data: { logoUrl: logoUrl || null },
        });
      }
      return existing;
    }
    return (this.prisma as any).vendor.create({
      data: { familyId, name, logoUrl: logoUrl || null },
    });
  }

  async updateVendor(id: string, familyId: string, data: { name?: string; logoUrl?: string | null }) {
    const vendor = await (this.prisma as any).vendor.findFirst({ where: { id, familyId } });
    if (!vendor) throw new NotFoundException(`Vendor ${id} not found`);
    if (data.name && data.name !== vendor.name) {
      const conflict = await (this.prisma as any).vendor.findFirst({
        where: { familyId, name: data.name },
      });
      if (conflict) throw new ConflictException(`Vendor "${data.name}" already exists`);
    }
    return (this.prisma as any).vendor.update({
      where: { id },
      data: { name: data.name, logoUrl: data.logoUrl },
    });
  }

  async removeVendor(id: string, familyId: string) {
    const vendor = await (this.prisma as any).vendor.findFirst({ where: { id, familyId } });
    if (!vendor) throw new NotFoundException(`Vendor ${id} not found`);
    await (this.prisma as any).vendor.delete({ where: { id } });
    return { message: "Vendor deleted" };
  }
}
