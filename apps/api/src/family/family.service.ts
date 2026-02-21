import { Injectable, NotFoundException } from "@nestjs/common";
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
}
