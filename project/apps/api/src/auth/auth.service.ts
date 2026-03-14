import {
  Injectable,
  UnauthorizedException,
  Logger,
  ConflictException,
  BadRequestException,
  ForbiddenException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { PrismaService } from "../prisma/prisma.service";
import * as bcrypt from "bcryptjs";
import { createHmac, randomBytes } from "crypto";
import { JwtPayload } from "./strategies/jwt.strategy";

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  /**
   * Register a new user with password
   */
  async registerWithPassword(
    name: string,
    username: string,
    password: string,
  ): Promise<{ accessToken: string; user: any }> {
    const existingUser = await this.prisma.user.findUnique({
      where: { username: username.toLowerCase() },
    });

    if (existingUser) {
      throw new ConflictException("User with this username already exists");
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const family = await this.prisma.family.create({
      data: {
        name: `${name}'s Family`,
      },
    });

    const user = await this.prisma.user.create({
      data: {
        username: username.toLowerCase(),
        name,
        passwordHash,
        familyId: family.id,
        role: "ADMIN",
      },
      include: {
        family: true,
      },
    });

    const payload: JwtPayload = {
      sub: user.id,
      username: user.username,
      familyId: user.familyId,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        avatarUrl: user.avatarUrl,
        role: user.role,
        familyId: user.familyId,
        twoFactorEnabled: user.twoFactorEnabled,
        family: user.family,
      },
    };
  }

  /**
   * Login with username and password
   */
  async loginWithPassword(
    username: string,
    password: string,
    twoFactorCode?: string,
    recoveryCode?: string,
  ): Promise<{ accessToken: string; user: any }> {
    const user = await this.prisma.user.findUnique({
      where: { username: username.toLowerCase() },
      include: {
        family: true,
      },
    });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException("Invalid username or password");
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException("Invalid username or password");
    }

    if (user.twoFactorEnabled) {
      if (twoFactorCode) {
        if (
          !user.twoFactorSecret ||
          !this.verifyTotp(user.twoFactorSecret, twoFactorCode)
        ) {
          throw new UnauthorizedException("Invalid two-factor code");
        }
      } else if (recoveryCode) {
        const consumed = await this.consumeRecoveryCode(user.id, recoveryCode);
        if (!consumed) {
          throw new UnauthorizedException("Invalid recovery code");
        }
      } else {
        throw new UnauthorizedException("Two-factor code is required");
      }
    }

    const payload: JwtPayload = {
      sub: user.id,
      username: user.username,
      familyId: user.familyId,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        avatarUrl: user.avatarUrl,
        role: user.role,
        familyId: user.familyId,
        twoFactorEnabled: user.twoFactorEnabled,
        family: user.family,
      },
    };
  }

  private async consumeRecoveryCode(
    userId: string,
    recoveryCode: string,
  ): Promise<boolean> {
    const normalizedCode = recoveryCode.trim().toLowerCase();

    const updatedRows = await this.prisma.$executeRaw`
      UPDATE "users"
      SET "twoFactorRecoveryCodes" = array_remove("twoFactorRecoveryCodes", ${normalizedCode}),
          "updatedAt" = NOW()
      WHERE id = ${userId}
        AND "twoFactorEnabled" = true
        AND ${normalizedCode} = ANY("twoFactorRecoveryCodes")
    `;

    return updatedRows === 1;
  }

  /**
   * Change password for a user
   */
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException("Invalid credentials");
    }

    const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValid) {
      throw new BadRequestException("Current password is incorrect");
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    return { message: "Password changed successfully" };
  }

  /**
   * Get current user info
   */
  async getCurrentUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        family: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException("User not found");
    }

    return {
      id: user.id,
      username: user.username,
      name: user.name,
      avatarUrl: user.avatarUrl,
      role: user.role,
      familyId: user.familyId,
      family: user.family,
    };
  }

  async deleteMyAccount(
    userId: string,
    currentPassword: string,
  ): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.passwordHash) {
      throw new UnauthorizedException("Invalid credentials");
    }

    const passwordOk = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!passwordOk) {
      throw new BadRequestException("Current password is incorrect");
    }

    if (user.role === "ADMIN") {
      const adminCount = await this.prisma.user.count({
        where: { familyId: user.familyId, role: "ADMIN" },
      });
      if (adminCount <= 1) {
        throw new ForbiddenException("Cannot delete the last admin user");
      }
    }

    await this.prisma.$transaction(async (tx: any) => {
      await tx.invoice.updateMany({
        where: { ownerUserId: userId, isPersonal: true },
        data: { isPersonal: false, ownerUserId: null },
      });

      await tx.user.delete({ where: { id: userId } });
    });

    return { message: "Account deleted successfully" };
  }
  async getTwoFactorStatus(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException("User not found");
    return { enabled: user.twoFactorEnabled };
  }

  async setupTwoFactor(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException("User not found");

    const secret = this.generateBase32Secret();
    const recoveryCodes = Array.from({ length: 8 }, () =>
      randomBytes(4).toString("hex"),
    );

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorSecret: secret,
        twoFactorEnabled: false,
        twoFactorRecoveryCodes: recoveryCodes,
      },
    });

    const issuer = encodeURIComponent("Kost");
    const label = encodeURIComponent(`${user.username}`);
    const otpauthUrl = `otpauth://totp/${issuer}:${label}?secret=${secret}&issuer=${issuer}&algorithm=SHA1&digits=6&period=30`;

    return {
      secret,
      otpauthUrl,
      recoveryCodes,
    };
  }

  async enableTwoFactor(userId: string, code: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user?.twoFactorSecret) {
      throw new BadRequestException("2FA is not set up");
    }

    if (!this.verifyTotp(user.twoFactorSecret, code)) {
      throw new BadRequestException("Invalid 2FA code");
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { twoFactorEnabled: true },
    });

    return { message: "Two-factor authentication enabled" };
  }

  async disableTwoFactor(userId: string, currentPassword: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.passwordHash) {
      throw new UnauthorizedException("Invalid credentials");
    }

    const ok = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!ok) {
      throw new BadRequestException("Current password is incorrect");
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
        twoFactorRecoveryCodes: [],
      },
    });

    return { message: "Two-factor authentication disabled" };
  }

  async regenerateRecoveryCodes(userId: string, currentPassword: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.passwordHash) {
      throw new UnauthorizedException("Invalid credentials");
    }
    if (!user.twoFactorEnabled) {
      throw new BadRequestException("2FA is not enabled");
    }

    const ok = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!ok) {
      throw new BadRequestException("Current password is incorrect");
    }

    const recoveryCodes = Array.from({ length: 8 }, () =>
      randomBytes(4).toString("hex"),
    );
    await this.prisma.user.update({
      where: { id: userId },
      data: { twoFactorRecoveryCodes: recoveryCodes },
    });

    return { recoveryCodes };
  }

  private generateBase32Secret(length = 20) {
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
    const bytes = randomBytes(length);
    let secret = "";
    for (let i = 0; i < bytes.length; i++) {
      secret += alphabet[bytes[i] % alphabet.length];
    }
    return secret;
  }

  private base32Decode(input: string): Buffer {
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
    let bits = "";
    for (const ch of input.replace(/=+$/g, "").toUpperCase()) {
      const val = alphabet.indexOf(ch);
      if (val < 0) continue;
      bits += val.toString(2).padStart(5, "0");
    }

    const bytes: number[] = [];
    for (let i = 0; i + 8 <= bits.length; i += 8) {
      bytes.push(parseInt(bits.slice(i, i + 8), 2));
    }
    return Buffer.from(bytes);
  }

  private generateTotp(secret: string, timeStep?: number) {
    const key = this.base32Decode(secret);
    const counter = Buffer.alloc(8);
    const step = timeStep ?? Math.floor(Date.now() / 1000 / 30);
    counter.writeBigUInt64BE(BigInt(step));

    const hmac = createHmac("sha1", key).update(counter).digest();
    const offset = hmac[hmac.length - 1] & 0x0f;
    const code =
      ((hmac[offset] & 0x7f) << 24) |
      ((hmac[offset + 1] & 0xff) << 16) |
      ((hmac[offset + 2] & 0xff) << 8) |
      (hmac[offset + 3] & 0xff);

    return String(code % 1000000).padStart(6, "0");
  }

  private verifyTotp(secret: string, providedCode: string) {
    const currentStep = Math.floor(Date.now() / 1000 / 30);
    for (let drift = -1; drift <= 1; drift++) {
      if (this.generateTotp(secret, currentStep + drift) === providedCode) {
        return true;
      }
    }
    return false;
  }
}
