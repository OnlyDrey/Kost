import {
  Controller, Get, Post, Patch, Delete, Body, Param, UseGuards,
  UseInterceptors, UploadedFile, BadRequestException,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { diskStorage } from "multer";
import { extname, join } from "path";
import { Request } from "express";

type MulterFile = { filename: string; originalname: string; mimetype: string; size: number };
import { mkdirSync } from "fs";
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

  @Delete("categories")
  @ApiOperation({ summary: "Bulk remove categories" })
  removeCategories(
    @CurrentUser("familyId") familyId: string,
    @Body("names") names: string[],
  ) {
    return this.familyService.removeCategories(familyId, names ?? []);
  }

  @Patch("categories")
  @ApiOperation({ summary: "Rename a category" })
  renameCategory(
    @CurrentUser("familyId") familyId: string,
    @Body("oldName") oldName: string,
    @Body("newName") newName: string,
  ) {
    return this.familyService.renameCategory(familyId, oldName?.trim(), newName?.trim());
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

  @Delete("payment-methods")
  @ApiOperation({ summary: "Bulk remove payment methods" })
  removePaymentMethods(
    @CurrentUser("familyId") familyId: string,
    @Body("names") names: string[],
  ) {
    return this.familyService.removePaymentMethods(familyId, names ?? []);
  }

  @Patch("payment-methods")
  @ApiOperation({ summary: "Rename a payment method" })
  renamePaymentMethod(
    @CurrentUser("familyId") familyId: string,
    @Body("oldName") oldName: string,
    @Body("newName") newName: string,
  ) {
    return this.familyService.renamePaymentMethod(familyId, oldName?.trim(), newName?.trim());
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

  // ─── Currency symbol position ────────────────────────────────────────────────

  @Get("currency-symbol-position")
  @ApiOperation({ summary: "Get family currency symbol position (Before or After)" })
  getCurrencySymbolPosition(@CurrentUser("familyId") familyId: string) {
    return this.familyService.getCurrencySymbolPosition(familyId);
  }

  @Patch("currency-symbol-position")
  @ApiOperation({ summary: "Update family currency symbol position" })
  updateCurrencySymbolPosition(
    @CurrentUser("familyId") familyId: string,
    @Body("position") position: string,
  ) {
    return this.familyService.updateCurrencySymbolPosition(familyId, position?.trim());
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

  @Post("vendors/:id/logo")
  @ApiOperation({ summary: "Upload logo image for a vendor" })
  @UseInterceptors(
    FileInterceptor("logo", {
      storage: diskStorage({
        destination: (_req: Request, _file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) => {
          const dir = join(process.cwd(), "uploads", "vendors");
          mkdirSync(dir, { recursive: true });
          cb(null, dir);
        },
        filename: (req: Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => {
          const ext = extname(file.originalname).toLowerCase() || ".jpg";
          cb(null, `${req.params["id"]}${ext}`);
        },
      }),
      fileFilter: (_req: Request, file: Express.Multer.File, cb: (error: Error | null, acceptFile: boolean) => void) => {
        // Support common image MIME types including HEIC
        const supportedMimeTypes = [
          "image/jpeg",
          "image/jpg",
          "image/png",
          "image/gif",
          "image/webp",
          "image/heic",
          "image/heif",
        ];

        if (!supportedMimeTypes.includes(file.mimetype) && !file.mimetype.startsWith("image/")) {
          cb(new BadRequestException("Only image files are allowed (JPEG, PNG, GIF, WebP, HEIC)"), false);
        } else {
          cb(null, true);
        }
      },
      limits: { fileSize: 2 * 1024 * 1024 },
    }),
  )
  uploadVendorLogo(
    @Param("id") id: string,
    @UploadedFile() file: MulterFile,
    @CurrentUser("familyId") familyId: string,
  ) {
    if (!file) throw new BadRequestException("No file uploaded");
    return this.familyService.uploadVendorLogo(id, familyId, file);
  }

  @Delete("vendors/:id")
  @ApiOperation({ summary: "Remove a vendor" })
  removeVendor(
    @Param("id") id: string,
    @CurrentUser("familyId") familyId: string,
  ) {
    return this.familyService.removeVendor(id, familyId);
  }

  @Delete("vendors")
  @ApiOperation({ summary: "Bulk remove vendors" })
  removeVendors(
    @CurrentUser("familyId") familyId: string,
    @Body("ids") ids: string[],
  ) {
    return this.familyService.removeVendors(familyId, ids ?? []);
  }
}
