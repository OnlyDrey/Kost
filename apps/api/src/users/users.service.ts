import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { UserRole } from "@prisma/client";
import * as bcrypt from "bcryptjs";
import { existsSync, unlinkSync } from "fs";
import { join } from "path";

const userSelect = {
  id: true,
  username: true,
  name: true,
  avatarUrl: true,
  role: true,
  familyId: true,
  createdAt: true,
  updatedAt: true,
} as const;

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get all users in the family
   */
  async findAll(familyId: string) {
    return this.prisma.user.findMany({
      where: { familyId },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        username: true,
        name: true,
        avatarUrl: true,
        role: true,
        familyId: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  /**
   * Get a specific user by ID
   */
  async findOne(id: string, familyId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, familyId },
      select: {
        id: true,
        username: true,
        name: true,
        avatarUrl: true,
        role: true,
        familyId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  /**
   * Create a new user (Admin only)
   */
  async create(createUserDto: CreateUserDto, familyId: string) {
    // Check if user with username already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { username: createUserDto.username.toLowerCase() },
    });

    if (existingUser) {
      throw new ConflictException("User with this username already exists");
    }

    const passwordHash = createUserDto.password
      ? await bcrypt.hash(createUserDto.password, 10)
      : undefined;

    return this.prisma.user.create({
      data: {
        username: createUserDto.username.toLowerCase(),
        name: createUserDto.name,
        role: createUserDto.role,
        familyId,
        ...(passwordHash && { passwordHash }),
      },
      select: {
        id: true,
        username: true,
        name: true,
        avatarUrl: true,
        role: true,
        familyId: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  /**
   * Update a user
   */
  async update(
    id: string,
    updateUserDto: UpdateUserDto,
    familyId: string,
    currentUserId: string,
    currentUserRole: UserRole,
  ) {
    // Verify user exists and belongs to family
    const user = await this.prisma.user.findFirst({
      where: { id, familyId },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    // Only admins can change roles or update other users
    if (id !== currentUserId && currentUserRole !== UserRole.ADMIN) {
      throw new ForbiddenException("Only admins can update other users");
    }

    if (updateUserDto.role && currentUserRole !== UserRole.ADMIN) {
      throw new ForbiddenException("Only admins can change user roles");
    }

    // Check username uniqueness if changing username
    if (
      updateUserDto.username &&
      updateUserDto.username.toLowerCase() !== user.username
    ) {
      const existingUser = await this.prisma.user.findUnique({
        where: { username: updateUserDto.username.toLowerCase() },
      });

      if (existingUser) {
        throw new ConflictException("User with this username already exists");
      }
    }

    const passwordHash = updateUserDto.password
      ? await bcrypt.hash(updateUserDto.password, 10)
      : undefined;

    return this.prisma.user.update({
      where: { id },
      data: {
        ...(updateUserDto.username && {
          username: updateUserDto.username.toLowerCase(),
        }),
        ...(updateUserDto.name && { name: updateUserDto.name }),
        ...(updateUserDto.role && { role: updateUserDto.role }),
        ...(passwordHash && { passwordHash }),
        ...(updateUserDto.avatarUrl !== undefined && {
          avatarUrl: updateUserDto.avatarUrl,
        }),
      },
      select: {
        id: true,
        username: true,
        name: true,
        avatarUrl: true,
        role: true,
        familyId: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  /**
   * Delete a user (Admin only)
   */
  async remove(id: string, familyId: string) {
    // Verify user exists and belongs to family
    const user = await this.prisma.user.findFirst({
      where: { id, familyId },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    // Prevent deleting the last admin
    if (user.role === UserRole.ADMIN) {
      const adminCount = await this.prisma.user.count({
        where: { familyId, role: UserRole.ADMIN },
      });

      if (adminCount <= 1) {
        throw new ForbiddenException("Cannot delete the last admin user");
      }
    }

    await this.prisma.user.delete({
      where: { id },
    });

    return { message: "User deleted successfully" };
  }

  private deleteLocalFile(urlPath: string | null | undefined) {
    if (!urlPath?.startsWith("/uploads/")) return;
    const filePath = join(process.cwd(), urlPath.slice(1));
    if (existsSync(filePath)) unlinkSync(filePath);
  }

  async uploadAvatar(
    id: string,
    file: { filename: string },
    familyId: string,
    currentUserId: string,
    currentUserRole: UserRole,
  ) {
    const user = await this.prisma.user.findFirst({ where: { id, familyId } });
    if (!user) throw new NotFoundException(`User ${id} not found`);
    if (id !== currentUserId && currentUserRole !== UserRole.ADMIN) {
      throw new ForbiddenException("Only admins can update other users");
    }

    const newUrl = `/uploads/avatars/${file.filename}`;
    if (user.avatarUrl && user.avatarUrl !== newUrl) {
      this.deleteLocalFile(user.avatarUrl);
    }

    return this.prisma.user.update({
      where: { id },
      data: { avatarUrl: newUrl },
      select: userSelect,
    });
  }

  async removeAvatar(
    id: string,
    familyId: string,
    currentUserId: string,
    currentUserRole: UserRole,
  ) {
    const user = await this.prisma.user.findFirst({ where: { id, familyId } });
    if (!user) throw new NotFoundException(`User ${id} not found`);
    if (id !== currentUserId && currentUserRole !== UserRole.ADMIN) {
      throw new ForbiddenException("Only admins can update other users");
    }

    this.deleteLocalFile(user.avatarUrl);

    return this.prisma.user.update({
      where: { id },
      data: { avatarUrl: null },
      select: userSelect,
    });
  }
}
