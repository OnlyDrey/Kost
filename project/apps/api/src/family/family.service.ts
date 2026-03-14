import { Injectable, NotFoundException, ConflictException } from "@nestjs/common";
import { spawnSync } from "child_process";
import { PrismaService } from "../prisma/prisma.service";
import { existsSync, unlinkSync, mkdirSync, readFileSync, writeFileSync, copyFileSync, rmSync, statSync } from "fs";
import { extname, join } from "path";

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
    return this.removeCategories(familyId, [name]);
  }

  async removeCategories(familyId: string, names: string[]): Promise<string[]> {
    const family = await this.getFamily(familyId);
    const removeSet = new Set(names);
    const updated = await this.prisma.family.update({
      where: { id: familyId },
      data: { categories: family.categories.filter((c: string) => !removeSet.has(c)) },
    });
    return updated.categories;
  }

  async renameCategory(familyId: string, oldName: string, newName: string): Promise<string[]> {
    const family = await this.getFamily(familyId);
    if (!oldName || !newName || oldName === newName) return family.categories;
    if (!family.categories.includes(oldName)) return family.categories;
    if (family.categories.includes(newName)) {
      throw new ConflictException(`Category "${newName}" already exists`);
    }

    const updated = await this.prisma.family.update({
      where: { id: familyId },
      data: {
        categories: family.categories.map((category: string) => (category === oldName ? newName : category)),
      },
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
    return this.removePaymentMethods(familyId, [name]);
  }

  async removePaymentMethods(familyId: string, names: string[]): Promise<string[]> {
    const family = await this.getFamily(familyId);
    const removeSet = new Set(names);
    const updated = await this.prisma.family.update({
      where: { id: familyId },
      data: { paymentMethods: family.paymentMethods.filter((m: string) => !removeSet.has(m)) },
    });
    return updated.paymentMethods;
  }

  async renamePaymentMethod(familyId: string, oldName: string, newName: string): Promise<string[]> {
    const family = await this.getFamily(familyId);
    if (!oldName || !newName || oldName === newName) return family.paymentMethods;
    if (!family.paymentMethods.includes(oldName)) return family.paymentMethods;
    if (family.paymentMethods.includes(newName)) {
      throw new ConflictException(`Payment method "${newName}" already exists`);
    }

    const updated = await this.prisma.family.update({
      where: { id: familyId },
      data: {
        paymentMethods: family.paymentMethods.map((method: string) => (method === oldName ? newName : method)),
      },
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

  async getCurrencySymbolPosition(familyId: string): Promise<string> {
    const family = await this.getFamily(familyId);
    return (family as any).currencySymbolPosition ?? "Before";
  }

  async updateCurrencySymbolPosition(familyId: string, position: string): Promise<string> {
    if (position !== "Before" && position !== "After") {
      throw new Error(`Invalid currencySymbolPosition value: ${position}. Must be 'Before' or 'After'.`);
    }
    await this.getFamily(familyId);
    const updated = await this.prisma.family.update({
      where: { id: familyId },
      data: { currencySymbolPosition: position } as any,
    });
    return (updated as any).currencySymbolPosition;
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
    this.deleteLocalFile(vendor.logoUrl);
    await (this.prisma as any).vendor.delete({ where: { id } });
    return { message: "Vendor deleted" };
  }

  async removeVendors(familyId: string, ids: string[]) {
    if (!ids.length) return { count: 0 };

    const vendors = await (this.prisma as any).vendor.findMany({
      where: { familyId, id: { in: ids } },
    });

    vendors.forEach((vendor: { logoUrl?: string | null }) => this.deleteLocalFile(vendor.logoUrl));

    return (this.prisma as any).vendor.deleteMany({
      where: { familyId, id: { in: ids } },
    });
  }

  private deleteLocalFile(urlPath: string | null | undefined) {
    if (!urlPath?.startsWith("/uploads/")) return;
    const filePath = join(process.cwd(), urlPath.slice(1));
    if (existsSync(filePath)) unlinkSync(filePath);
  }



  private getBrandingDir(familyId: string) {
    return join(process.cwd(), "uploads", "branding", familyId);
  }

  private getBrandingConfigPath(familyId: string) {
    return join(this.getBrandingDir(familyId), "config.json");
  }

  private getBrandingPublicRoot(familyId: string) {
    return `/uploads/branding/${familyId}`;
  }

  private ensureBrandingDefaults(familyId: string) {
    const dir = this.getBrandingDir(familyId);
    mkdirSync(join(dir, "generated"), { recursive: true });

    const configPath = this.getBrandingConfigPath(familyId);
    if (!existsSync(configPath)) {
      writeFileSync(
        configPath,
        JSON.stringify(
          {
            appTitle: "Kost",
            appIconBackground: "#0B1020",
            sourceType: "default",
            logoUrl: "",
            logoExt: ".png",
            version: 1,
          },
          null,
          2,
        ),
      );
    }
  }

  private readBrandingConfig(familyId: string) {
    this.ensureBrandingDefaults(familyId);
    return JSON.parse(readFileSync(this.getBrandingConfigPath(familyId), "utf-8"));
  }

  private writeBrandingConfig(familyId: string, config: Record<string, unknown>) {
    writeFileSync(this.getBrandingConfigPath(familyId), JSON.stringify(config, null, 2));
  }


  private hasGeneratedBrandingAssets(familyId: string) {
    return this.getGeneratedAssetDiagnostics(familyId).valid;
  }

  private writeBrandingManifest(familyId: string, appTitle: string, background: string, version: number) {
    const root = this.getBrandingPublicRoot(familyId);
    const manifest = {
      name: appTitle,
      short_name: appTitle,
      description: "Shared expense tracking application",
      lang: "nb-NO",
      dir: "ltr",
      theme_color: background,
      background_color: background,
      display: "standalone",
      orientation: "portrait",
      scope: "/",
      start_url: "/",
      icons: [
        {
          src: `${root}/generated/pwa-192.png?v=${version}`,
          sizes: "192x192",
          type: "image/png",
          purpose: "any",
        },
        {
          src: `${root}/generated/pwa-192-maskable.png?v=${version}`,
          sizes: "192x192",
          type: "image/png",
          purpose: "maskable",
        },
        {
          src: `${root}/generated/pwa-512.png?v=${version}`,
          sizes: "512x512",
          type: "image/png",
          purpose: "any",
        },
        {
          src: `${root}/generated/pwa-512-maskable.png?v=${version}`,
          sizes: "512x512",
          type: "image/png",
          purpose: "maskable",
        },
      ],
    };
    writeFileSync(
      join(this.getBrandingDir(familyId), "manifest.webmanifest"),
      JSON.stringify(manifest, null, 2),
      "utf-8",
    );
  }

  getBrandingConfig(familyId: string) {
    const raw = this.readBrandingConfig(familyId);
    if (!this.hasGeneratedBrandingAssets(familyId)) {
      this.regenerateBrandingAssets(familyId);
    }
    const version = Number(raw.version ?? 1);
    const root = this.getBrandingPublicRoot(familyId);

    const isRuntimeIconOverride =
      raw.sourceType === "upload" ||
      (raw.sourceType === "url" && String(raw.logoUrl ?? "").trim().length > 0) ||
      String(raw.appIconBackground ?? "#0B1020").toUpperCase() !== "#0B1020" ||
      String(raw.appTitle ?? "Kost").trim() !== "Kost";

    return {
      ...raw,
      version,
      isRuntimeIconOverride,
      assetBase: `${root}/generated`,
      manifestUrl: `${root}/manifest.webmanifest?v=${version}`,
      previewIconUrl: `${root}/generated/preview-512.png?v=${version}`,
      logoSourceUrl:
        raw.sourceType === "upload"
          ? `${root}/source${raw.logoExt ?? ".png"}?v=${version}`
          : raw.logoUrl || "/logo-mark.svg",
    };
  }

  saveBrandingConfig(
    familyId: string,
    data: {
      appTitle?: string;
      appIconBackground?: string;
      logoUrl?: string;
      resetLogo?: boolean;
    },
  ) {
    const current = this.readBrandingConfig(familyId);
    const next = { ...current } as Record<string, unknown>;

    if (data.appTitle !== undefined) next.appTitle = data.appTitle || "Kost";
    if (data.appIconBackground !== undefined) {
      next.appIconBackground = data.appIconBackground || "#0B1020";
    }
    if (data.logoUrl !== undefined) {
      next.logoUrl = data.logoUrl.trim();
      if (data.logoUrl.trim()) {
        next.sourceType = "url";
      } else if (next.sourceType === "url") {
        next.sourceType = "default";
      }
    }
    if (data.resetLogo) {
      next.sourceType = "default";
      next.logoUrl = "";
      const ext = String(next.logoExt ?? ".png");
      const uploaded = join(this.getBrandingDir(familyId), `source${ext}`);
      if (existsSync(uploaded)) {
        rmSync(uploaded, { force: true });
      }
    }

    next.version = Number(current.version ?? 1) + 1;
    this.writeBrandingConfig(familyId, next);
    this.regenerateBrandingAssets(familyId);
    return this.getBrandingConfig(familyId);
  }

  uploadBrandingLogo(
    familyId: string,
    file: { filename: string; originalname?: string },
  ) {
    const current = this.readBrandingConfig(familyId);
    const ext = extname(file.originalname || file.filename || ".png") || ".png";
    const dir = this.getBrandingDir(familyId);
    const sourcePath = join(dir, `source${ext}`);
    copyFileSync(join(process.cwd(), "uploads", "branding", "tmp", file.filename), sourcePath);

    const priorExt = String(current.logoExt ?? ".png");
    if (priorExt !== ext) {
      const oldSource = join(dir, `source${priorExt}`);
      if (existsSync(oldSource)) {
        rmSync(oldSource, { force: true });
      }
    }

    const next = {
      ...current,
      sourceType: "upload",
      logoExt: ext,
      logoUrl: "",
      version: Number(current.version ?? 1) + 1,
    };

    this.writeBrandingConfig(familyId, next);
    this.regenerateBrandingAssets(familyId);
    return this.getBrandingConfig(familyId);
  }


  private parsePngDimensions(filePath: string): { width: number; height: number } | null {
    try {
      const buffer = readFileSync(filePath);
      if (buffer.length < 24) return null;
      const signature = buffer.subarray(0, 8);
      const expected = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
      if (!signature.equals(expected)) return null;
      const width = buffer.readUInt32BE(16);
      const height = buffer.readUInt32BE(20);
      return { width, height };
    } catch {
      return null;
    }
  }

  private parseJpegDimensions(filePath: string): { width: number; height: number } | null {
    try {
      const buffer = readFileSync(filePath);
      if (buffer.length < 4 || buffer[0] !== 0xff || buffer[1] !== 0xd8) return null;
      let offset = 2;
      while (offset + 9 < buffer.length) {
        if (buffer[offset] !== 0xff) {
          offset += 1;
          continue;
        }
        const marker = buffer[offset + 1];
        offset += 2;
        if (marker === 0xd9 || marker === 0xda) break;
        const segmentLength = buffer.readUInt16BE(offset);
        if (segmentLength < 2 || offset + segmentLength > buffer.length) break;
        const isSOF = [0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf].includes(marker);
        if (isSOF && offset + 7 < buffer.length) {
          const height = buffer.readUInt16BE(offset + 3);
          const width = buffer.readUInt16BE(offset + 5);
          return { width, height };
        }
        offset += segmentLength;
      }
      return null;
    } catch {
      return null;
    }
  }

  private detectImageMetadata(filePath: string): { type: string; width?: number; height?: number; sizeBytes?: number; exists: boolean } {
    if (!existsSync(filePath)) return { type: "missing", exists: false };
    const sizeBytes = statSync(filePath).size;
    const png = this.parsePngDimensions(filePath);
    if (png) return { type: "png", width: png.width, height: png.height, sizeBytes, exists: true };
    const jpeg = this.parseJpegDimensions(filePath);
    if (jpeg) return { type: "jpeg", width: jpeg.width, height: jpeg.height, sizeBytes, exists: true };
    return { type: extname(filePath).replace(".", "") || "unknown", sizeBytes, exists: true };
  }

  private resolveBrandingGeneratorScriptPath() {
    const candidates = [
      join(process.cwd(), "scripts", "generate_branding_assets.py"),
      join(process.cwd(), "..", "..", "scripts", "generate_branding_assets.py"),
      join(process.cwd(), "..", "scripts", "generate_branding_assets.py"),
    ];
    const resolved = candidates.find((path) => existsSync(path));
    return { resolved, candidates };
  }

  private generatedAssetSpecs() {
    return [
      { name: "favicon-16.png", size: 16, minBytes: 80 },
      { name: "favicon-32.png", size: 32, minBytes: 100 },
      { name: "apple-touch-icon.png", size: 180, minBytes: 180 },
      { name: "icon-192.png", size: 192, minBytes: 200 },
      { name: "icon-512.png", size: 512, minBytes: 300 },
      { name: "icon-192-maskable.png", size: 192, minBytes: 200 },
      { name: "icon-512-maskable.png", size: 512, minBytes: 300 },
      { name: "preview-512.png", size: 512, minBytes: 300 },
      { name: "pwa-192.png", size: 192, minBytes: 200 },
      { name: "pwa-512.png", size: 512, minBytes: 300 },
      { name: "pwa-192-maskable.png", size: 192, minBytes: 200 },
      { name: "pwa-512-maskable.png", size: 512, minBytes: 300 },
      { name: "apple-180.png", size: 180, minBytes: 180 },
    ] as const;
  }

  private getGeneratedAssetDiagnostics(familyId: string) {
    const generatedDir = join(this.getBrandingDir(familyId), "generated");
    const generated: Array<{ name: string; bytes: number; width: number | null; height: number | null }> = [];
    const missing: string[] = [];

    const valid = this.generatedAssetSpecs().every(({ name, size, minBytes }) => {
      const filePath = join(generatedDir, name);
      if (!existsSync(filePath)) {
        missing.push(name);
        return false;
      }
      const fileStat = statSync(filePath);
      const dimensions = this.parsePngDimensions(filePath);
      generated.push({
        name,
        bytes: fileStat.size,
        width: dimensions?.width ?? null,
        height: dimensions?.height ?? null,
      });
      if (!dimensions) return false;
      return (
        dimensions.width === size &&
        dimensions.height === size &&
        fileStat.size >= minBytes
      );
    });

    return { valid, generated, missing };
  }

  private writeFallbackBrandingAssets(familyId: string) {
    const generatedDir = join(this.getBrandingDir(familyId), "generated");
    const publicDir = join(process.cwd(), "public");
    const defaultMapping: Record<string, string> = {
      "favicon-16.png": "pwa-192x192.png",
      "favicon-32.png": "pwa-192x192.png",
      "apple-touch-icon.png": "apple-touch-icon.png",
      "apple-180.png": "apple-touch-icon.png",
      "icon-192.png": "pwa-192x192.png",
      "icon-512.png": "pwa-512x512.png",
      "icon-192-maskable.png": "pwa-192x192.png",
      "icon-512-maskable.png": "pwa-512x512.png",
      "pwa-192.png": "pwa-192x192.png",
      "pwa-512.png": "pwa-512x512.png",
      "pwa-192-maskable.png": "pwa-192x192.png",
      "pwa-512-maskable.png": "pwa-512x512.png",
      "preview-512.png": "pwa-512x512.png",
    };

    this.generatedAssetSpecs().forEach(({ name }) => {
      const source = join(publicDir, defaultMapping[name] ?? "pwa-512x512.png");
      copyFileSync(source, join(generatedDir, name));
    });
  }

  regenerateBrandingAssets(familyId: string) {
    const config = this.readBrandingConfig(familyId);
    const defaultRasterPath = join(process.cwd(), "public", "apple-touch-icon.png");
    const { resolved: scriptPath, candidates: scriptCandidates } = this.resolveBrandingGeneratorScriptPath();
    const sourceLabel =
      config.sourceType === "upload"
        ? join(this.getBrandingDir(familyId), `source${String(config.logoExt ?? ".png")}`)
        : config.sourceType === "url"
          ? String(config.logoUrl ?? "")
          : defaultRasterPath;

    const outputDir = join(this.getBrandingDir(familyId), "generated");
    mkdirSync(outputDir, { recursive: true });

    const pythonCheck = spawnSync("python3", ["--version"], { encoding: "utf-8" });
    const pillowCheck = spawnSync("python3", ["-c", "import PIL; print(PIL.__version__)"], {
      encoding: "utf-8",
    });

    if (!scriptPath) {
      console.warn("[Branding] Generator script not found; using fallback assets", {
        familyId,
        cwd: process.cwd(),
        candidates: scriptCandidates,
      });
      this.writeFallbackBrandingAssets(familyId);
      this.writeBrandingManifest(
        familyId,
        String(config.appTitle ?? "Kost"),
        String(config.appIconBackground ?? "#0B1020"),
        Number(config.version ?? 1),
      );
      return;
    }

    const result = spawnSync(
      "python3",
      [
        scriptPath,
        this.getBrandingDir(familyId),
        defaultRasterPath,
      ],
      { encoding: "utf-8" },
    );

    const validation = this.getGeneratedAssetDiagnostics(familyId);

    if (result.status !== 0 || !validation.valid) {
      console.warn("[Branding] Icon generation failed; using fallback assets", {
        familyId,
        cwd: process.cwd(),
        sourceType: config.sourceType,
        source: sourceLabel,
        sourceMetadata: this.detectImageMetadata(sourceLabel),
        defaultSourceExists: existsSync(defaultRasterPath),
        outputDir,
        outputDirExists: existsSync(outputDir),
        scriptPath,
        pythonVersion: pythonCheck.stdout?.trim() || pythonCheck.stderr?.trim() || null,
        pythonCheckStatus: pythonCheck.status,
        pythonCheckError: pythonCheck.error?.message,
        pillowVersion: pillowCheck.stdout?.trim() || null,
        pillowCheckStatus: pillowCheck.status,
        pillowCheckStderr: pillowCheck.stderr?.trim() || null,
        pillowCheckError: pillowCheck.error?.message,
        status: result.status,
        signal: result.signal,
        stdout: result.stdout,
        stderr: result.stderr,
        spawnError: result.error?.message,
        validationValid: validation.valid,
        generatedFiles: validation.generated,
        missingFiles: validation.missing,
      });
      this.writeFallbackBrandingAssets(familyId);
    } else {
      console.info("[Branding] Icon generation succeeded", {
        familyId,
        cwd: process.cwd(),
        sourceType: config.sourceType,
        source: sourceLabel,
        sourceMetadata: this.detectImageMetadata(sourceLabel),
        scriptPath,
        outputDir,
        pythonVersion: pythonCheck.stdout?.trim() || pythonCheck.stderr?.trim() || null,
        pillowVersion: pillowCheck.stdout?.trim() || null,
        validationValid: validation.valid,
        generatedFiles: validation.generated,
      });
    }

    this.writeBrandingManifest(
      familyId,
      String(config.appTitle ?? "Kost"),
      String(config.appIconBackground ?? "#0B1020"),
      Number(config.version ?? 1),
    );
  }

  async uploadVendorLogo(id: string, familyId: string, file: { filename: string }) {
    const vendor = await (this.prisma as any).vendor.findFirst({ where: { id, familyId } });
    if (!vendor) throw new NotFoundException(`Vendor ${id} not found`);

    const newUrl = `/uploads/vendors/${file.filename}`;
    if (vendor.logoUrl && vendor.logoUrl !== newUrl) {
      this.deleteLocalFile(vendor.logoUrl);
    }

    return (this.prisma as any).vendor.update({
      where: { id },
      data: { logoUrl: newUrl },
    });
  }
}
