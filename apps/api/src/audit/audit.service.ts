import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { AuditAction } from "@prisma/client";

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create an audit log entry
   */
  async createLog(
    familyId: string,
    userId: string | null,
    action: AuditAction,
    entityType: string,
    entityId: string,
    changes?: any,
    metadata?: any,
    ipAddress?: string,
    userAgent?: string,
  ) {
    return this.prisma.auditLog.create({
      data: {
        familyId,
        userId,
        action,
        entityType,
        entityId,
        changes: changes || null,
        metadata: metadata || null,
        ipAddress,
        userAgent,
      },
    });
  }

  /**
   * Get all audit logs for a family
   */
  async findAll(familyId: string, limit = 100, offset = 0) {
    const logs = await this.prisma.auditLog.findMany({
      where: { familyId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    });

    const total = await this.prisma.auditLog.count({
      where: { familyId },
    });

    return {
      logs,
      total,
      limit,
      offset,
    };
  }

  /**
   * Get audit logs for a specific entity
   */
  async findByEntity(entityType: string, entityId: string, familyId: string) {
    return this.prisma.auditLog.findMany({
      where: {
        familyId,
        entityType,
        entityId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Get audit logs for a specific user
   */
  async findByUser(userId: string, familyId: string, limit = 50, offset = 0) {
    // Verify user belongs to family
    const user = await this.prisma.user.findFirst({
      where: { id: userId, familyId },
    });

    if (!user) {
      throw new NotFoundException(`User ${userId} not found`);
    }

    const logs = await this.prisma.auditLog.findMany({
      where: {
        familyId,
        userId,
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    });

    const total = await this.prisma.auditLog.count({
      where: { familyId, userId },
    });

    return {
      logs,
      total,
      limit,
      offset,
    };
  }

  /**
   * Get audit logs by action type
   */
  async findByAction(
    action: AuditAction,
    familyId: string,
    limit = 50,
    offset = 0,
  ) {
    const logs = await this.prisma.auditLog.findMany({
      where: {
        familyId,
        action,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    });

    const total = await this.prisma.auditLog.count({
      where: { familyId, action },
    });

    return {
      logs,
      total,
      limit,
      offset,
    };
  }

  /**
   * Get a specific audit log by ID
   */
  async findOne(id: string, familyId: string) {
    const log = await this.prisma.auditLog.findFirst({
      where: { id, familyId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    if (!log) {
      throw new NotFoundException(`Audit log with ID ${id} not found`);
    }

    return log;
  }

  /**
   * Delete old audit logs (for cleanup/GDPR compliance)
   * Typically called by a cron job
   */
  async deleteOldLogs(daysToKeep = 365) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const result = await this.prisma.auditLog.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate,
        },
      },
    });

    return {
      message: `Deleted ${result.count} audit logs older than ${daysToKeep} days`,
      count: result.count,
    };
  }
}
