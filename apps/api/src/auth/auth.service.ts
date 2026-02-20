import {
  Injectable,
  UnauthorizedException,
  Logger,
  ConflictException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { PrismaService } from "../prisma/prisma.service";
import * as bcrypt from "bcryptjs";
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
        role: user.role,
        familyId: user.familyId,
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
        role: user.role,
        familyId: user.familyId,
        family: user.family,
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
      username: user.username,
      name: user.name,
      role: user.role,
      familyId: user.familyId,
      family: user.family,
    };
  }
}
