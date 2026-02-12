import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserRole } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get all users in the family
   */
  async findAll(familyId: string) {
    return this.prisma.user.findMany({
      where: { familyId },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        email: true,
        name: true,
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
        email: true,
        name: true,
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
    // Check if user with email already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: createUserDto.email.toLowerCase() },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    return this.prisma.user.create({
      data: {
        email: createUserDto.email.toLowerCase(),
        name: createUserDto.name,
        role: createUserDto.role,
        familyId,
      },
      select: {
        id: true,
        email: true,
        name: true,
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
  async update(id: string, updateUserDto: UpdateUserDto, familyId: string, currentUserId: string, currentUserRole: UserRole) {
    // Verify user exists and belongs to family
    const user = await this.prisma.user.findFirst({
      where: { id, familyId },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    // Only admins can change roles or update other users
    if (id !== currentUserId && currentUserRole !== UserRole.ADMIN) {
      throw new ForbiddenException('Only admins can update other users');
    }

    if (updateUserDto.role && currentUserRole !== UserRole.ADMIN) {
      throw new ForbiddenException('Only admins can change user roles');
    }

    // Check email uniqueness if changing email
    if (updateUserDto.email && updateUserDto.email.toLowerCase() !== user.email) {
      const existingUser = await this.prisma.user.findUnique({
        where: { email: updateUserDto.email.toLowerCase() },
      });

      if (existingUser) {
        throw new ConflictException('User with this email already exists');
      }
    }

    return this.prisma.user.update({
      where: { id },
      data: {
        ...(updateUserDto.email && { email: updateUserDto.email.toLowerCase() }),
        ...(updateUserDto.name && { name: updateUserDto.name }),
        ...(updateUserDto.role && { role: updateUserDto.role }),
      },
      select: {
        id: true,
        email: true,
        name: true,
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
        throw new ForbiddenException('Cannot delete the last admin user');
      }
    }

    await this.prisma.user.delete({
      where: { id },
    });

    return { message: 'User deleted successfully' };
  }
}
