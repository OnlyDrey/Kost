import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { FamilyService } from "./family.service";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { CurrentUser } from "../common/decorators/current-user.decorator";

@ApiTags("family")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("family")
export class FamilyController {
  constructor(private readonly familyService: FamilyService) {}

  // ─── Categories ─────────────────────────────────────────────────────────────

  @Get("categories")
  @ApiOperation({ summary: "Get all categories for this family" })
  getCategories(@CurrentUser("familyId") familyId: string) {
    return this.familyService.getCategories(familyId);
  }

  @Post("categories")
  @ApiOperation({ summary: "Add a category" })
  addCategory(
    @CurrentUser("familyId") familyId: string,
    @Body("name") name: string,
  ) {
    return this.familyService.addCategory(familyId, name.trim());
  }

  @Delete("categories/:name")
  @ApiOperation({ summary: "Remove a category" })
  removeCategory(
    @CurrentUser("familyId") familyId: string,
    @Param("name") name: string,
  ) {
    return this.familyService.removeCategory(familyId, name);
  }

  // ─── Payment methods ─────────────────────────────────────────────────────────

  @Get("payment-methods")
  @ApiOperation({ summary: "Get all payment methods for this family" })
  getPaymentMethods(@CurrentUser("familyId") familyId: string) {
    return this.familyService.getPaymentMethods(familyId);
  }

  @Post("payment-methods")
  @ApiOperation({ summary: "Add a payment method" })
  addPaymentMethod(
    @CurrentUser("familyId") familyId: string,
    @Body("name") name: string,
  ) {
    return this.familyService.addPaymentMethod(familyId, name.trim());
  }

  @Delete("payment-methods/:name")
  @ApiOperation({ summary: "Remove a payment method" })
  removePaymentMethod(
    @CurrentUser("familyId") familyId: string,
    @Param("name") name: string,
  ) {
    return this.familyService.removePaymentMethod(familyId, name);
  }

  // ─── Currency ────────────────────────────────────────────────────────────────

  @Get("currency")
  @ApiOperation({ summary: "Get family currency" })
  getCurrency(@CurrentUser("familyId") familyId: string) {
    return this.familyService.getCurrency(familyId);
  }

  @Patch("currency")
  @ApiOperation({ summary: "Update family currency" })
  updateCurrency(
    @CurrentUser("familyId") familyId: string,
    @Body("currency") currency: string,
  ) {
    return this.familyService.updateCurrency(familyId, currency.trim().toUpperCase());
  }

  // ─── Vendors ─────────────────────────────────────────────────────────────────

  @Get("vendors")
  @ApiOperation({ summary: "Get all vendors for this family" })
  getVendors(@CurrentUser("familyId") familyId: string) {
    return this.familyService.getVendors(familyId);
  }

  @Post("vendors")
  @ApiOperation({ summary: "Add or update a vendor" })
  addVendor(
    @CurrentUser("familyId") familyId: string,
    @Body("name") name: string,
    @Body("logoUrl") logoUrl?: string,
  ) {
    return this.familyService.addVendor(familyId, name.trim(), logoUrl);
  }

  @Patch("vendors/:id")
  @ApiOperation({ summary: "Update a vendor" })
  updateVendor(
    @Param("id") id: string,
    @CurrentUser("familyId") familyId: string,
    @Body() data: { name?: string; logoUrl?: string | null },
  ) {
    return this.familyService.updateVendor(id, familyId, data);
  }

  @Delete("vendors/:id")
  @ApiOperation({ summary: "Remove a vendor" })
  removeVendor(
    @Param("id") id: string,
    @CurrentUser("familyId") familyId: string,
  ) {
    return this.familyService.removeVendor(id, familyId);
  }
}
