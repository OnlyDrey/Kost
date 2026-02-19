import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  Logger,
  NotImplementedException,
  ConflictException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../prisma/prisma.service";
import { randomBytes } from "crypto";
import * as nodemailer from "nodemailer";
import * as bcrypt from "bcryptjs";
import { JwtPayload } from "./strategies/jwt.strategy";

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private transporter: nodemailer.Transporter;

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {
    // Initialize email transporter only if magic link is enabled
    const isMagicLinkEnabled = this.configService.get<boolean>(
      "auth.magicLinkEnabled",
    );
    if (isMagicLinkEnabled) {
      const smtpConfig = this.configService.get("smtp");
      if (smtpConfig.host && smtpConfig.user) {
        this.transporter = nodemailer.createTransport({
          host: smtpConfig.host,
          port: smtpConfig.port,
          secure: smtpConfig.secure,
          auth: {
            user: smtpConfig.user,
            pass: smtpConfig.password,
          },
        });
      } else {
        this.logger.warn(
          "SMTP not configured - magic link emails will be logged instead",
        );
      }
    }
  }

  /**
   * Register a new user with password
   */
  async registerWithPassword(
    name: string,
    email: string,
    password: string,
  ): Promise<{ accessToken: string; user: any }> {
    const isPasswordEnabled = this.configService.get<boolean>(
      "auth.passwordEnabled",
    );
    if (!isPasswordEnabled) {
      throw new NotImplementedException(
        "Password authentication is not enabled",
      );
    }

    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      throw new ConflictException("User with this email already exists");
    }

    // Hash password with bcrypt (10 rounds)
    const passwordHash = await bcrypt.hash(password, 10);

    // Create family for the new user
    const family = await this.prisma.family.create({
      data: {
        name: `${name}'s Family`,
      },
    });

    // Create user
    const user = await this.prisma.user.create({
      data: {
        email: email.toLowerCase(),
        name,
        passwordHash,
        familyId: family.id,
        role: "ADMIN", // First user is admin
      },
      include: {
        family: true,
      },
    });

    // Generate JWT
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      familyId: user.familyId,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        familyId: user.familyId,
        family: user.family,
      },
    };
  }

  /**
   * Login with email and password
   */
  async loginWithPassword(
    email: string,
    password: string,
  ): Promise<{ accessToken: string; user: any }> {
    const isPasswordEnabled = this.configService.get<boolean>(
      "auth.passwordEnabled",
    );
    if (!isPasswordEnabled) {
      throw new NotImplementedException(
        "Password authentication is not enabled",
      );
    }

    // Find user by email
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: {
        family: true,
      },
    });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException("Invalid email or password");
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException("Invalid email or password");
    }

    // Generate JWT
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      familyId: user.familyId,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        familyId: user.familyId,
        family: user.family,
      },
    };
  }

  /**
   * Request a magic link for authentication
   */
  async requestMagicLink(email: string): Promise<{ message: string }> {
    const isMagicLinkEnabled = this.configService.get<boolean>(
      "auth.magicLinkEnabled",
    );
    if (!isMagicLinkEnabled) {
      throw new NotImplementedException(
        "Magic link authentication is not enabled",
      );
    }
    // Find user by email
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      // Don't reveal if user exists or not for security
      return {
        message:
          "If an account exists with this email, a magic link has been sent.",
      };
    }

    // Generate unique token
    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date();
    const expiresInSeconds = this.configService.get<number>(
      "magicLink.expiresIn",
      600,
    );
    expiresAt.setSeconds(expiresAt.getSeconds() + expiresInSeconds);

    // Store token in database
    await this.prisma.magicLinkToken.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
      },
    });

    // Send email with magic link
    const appUrl = this.configService.get<string>("app.url");
    const magicLink = `${appUrl}/auth/verify?token=${token}`;

    await this.sendMagicLinkEmail(user.email, user.name, magicLink);

    return {
      message:
        "If an account exists with this email, a magic link has been sent.",
    };
  }

  /**
   * Verify magic link token and return JWT
   */
  async verifyMagicLink(
    token: string,
  ): Promise<{ accessToken: string; user: any }> {
    const isMagicLinkEnabled = this.configService.get<boolean>(
      "auth.magicLinkEnabled",
    );
    if (!isMagicLinkEnabled) {
      throw new NotImplementedException(
        "Magic link authentication is not enabled",
      );
    }
    // Find and validate token
    const magicLinkToken = await this.prisma.magicLinkToken.findUnique({
      where: { token },
      include: {
        user: {
          include: {
            family: true,
          },
        },
      },
    });

    if (!magicLinkToken) {
      throw new UnauthorizedException("Invalid or expired magic link");
    }

    if (magicLinkToken.usedAt) {
      throw new UnauthorizedException("Magic link has already been used");
    }

    if (new Date() > magicLinkToken.expiresAt) {
      throw new UnauthorizedException("Magic link has expired");
    }

    // Mark token as used
    await this.prisma.magicLinkToken.update({
      where: { id: magicLinkToken.id },
      data: { usedAt: new Date() },
    });

    // Generate JWT
    const payload: JwtPayload = {
      sub: magicLinkToken.user.id,
      email: magicLinkToken.user.email,
      familyId: magicLinkToken.user.familyId,
      role: magicLinkToken.user.role,
    };

    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      user: {
        id: magicLinkToken.user.id,
        email: magicLinkToken.user.email,
        name: magicLinkToken.user.name,
        role: magicLinkToken.user.role,
        familyId: magicLinkToken.user.familyId,
        family: magicLinkToken.user.family,
      },
    };
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
      email: user.email,
      name: user.name,
      role: user.role,
      familyId: user.familyId,
      family: user.family,
    };
  }

  /**
   * Send magic link email
   */
  private async sendMagicLinkEmail(
    email: string,
    name: string,
    magicLink: string,
  ): Promise<void> {
    const smtpFrom = this.configService.get<string>("smtp.from");

    const mailOptions = {
      from: smtpFrom,
      to: email,
      subject: "Your Magic Link - Kost",
      html: `
        <h1>Hi ${name}!</h1>
        <p>Click the link below to sign in to Kost:</p>
        <p><a href="${magicLink}">${magicLink}</a></p>
        <p>This link will expire in 10 minutes.</p>
        <p>If you didn't request this link, you can safely ignore this email.</p>
      `,
      text: `Hi ${name}!\n\nClick the link below to sign in to Kost:\n${magicLink}\n\nThis link will expire in 10 minutes.\n\nIf you didn't request this link, you can safely ignore this email.`,
    };

    if (this.transporter) {
      try {
        await this.transporter.sendMail(mailOptions);
        this.logger.log(`Magic link email sent to ${email}`);
      } catch (error) {
        this.logger.error(
          `Failed to send magic link email to ${email}:`,
          error,
        );
        throw new BadRequestException("Failed to send magic link email");
      }
    } else {
      // Development: log the magic link
      this.logger.log(`Magic link for ${email}: ${magicLink}`);
    }
  }

  /**
   * Clean up expired magic link tokens (can be called by a cron job)
   */
  async cleanupExpiredTokens(): Promise<number> {
    const result = await this.prisma.magicLinkToken.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });

    this.logger.log(`Cleaned up ${result.count} expired magic link tokens`);
    return result.count;
  }
}
