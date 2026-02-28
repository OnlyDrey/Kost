import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from "@nestjs/swagger";
import { AuditService } from "./audit.service";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { Roles } from "../common/decorators/roles.decorator";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { UserRole, AuditAction } from "@prisma/client";

@ApiTags("audit")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("audit")
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: "Get all audit logs for the family (Admin only)" })
  @ApiQuery({ name: "limit", required: false, type: Number, example: 100 })
  @ApiQuery({ name: "offset", required: false, type: Number, example: 0 })
  @ApiResponse({ status: 200, description: "List of audit logs" })
  @ApiResponse({ status: 403, description: "Forbidden - Admin only" })
  findAll(
    @CurrentUser("familyId") familyId: string,
    @Query("limit", new DefaultValuePipe(100), ParseIntPipe) limit: number,
    @Query("offset", new DefaultValuePipe(0), ParseIntPipe) offset: number,
  ) {
    return this.auditService.findAll(familyId, limit, offset);
  }

  @Get("entity/:entityType/:entityId")
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: "Get audit logs for a specific entity (Admin only)",
  })
  @ApiResponse({ status: 200, description: "Audit logs for the entity" })
  @ApiResponse({ status: 403, description: "Forbidden - Admin only" })
  findByEntity(
    @Param("entityType") entityType: string,
    @Param("entityId") entityId: string,
    @CurrentUser("familyId") familyId: string,
  ) {
    return this.auditService.findByEntity(entityType, entityId, familyId);
  }

  @Get("user/:userId")
  @ApiOperation({ summary: "Get audit logs for a specific user" })
  @ApiQuery({ name: "limit", required: false, type: Number, example: 50 })
  @ApiQuery({ name: "offset", required: false, type: Number, example: 0 })
  @ApiResponse({ status: 200, description: "Audit logs for the user" })
  @ApiResponse({ status: 404, description: "User not found" })
  findByUser(
    @Param("userId") userId: string,
    @CurrentUser("familyId") familyId: string,
    @Query("limit", new DefaultValuePipe(50), ParseIntPipe) limit: number,
    @Query("offset", new DefaultValuePipe(0), ParseIntPipe) offset: number,
  ) {
    return this.auditService.findByUser(userId, familyId, limit, offset);
  }

  @Get("action/:action")
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: "Get audit logs by action type (Admin only)" })
  @ApiQuery({ name: "limit", required: false, type: Number, example: 50 })
  @ApiQuery({ name: "offset", required: false, type: Number, example: 0 })
  @ApiResponse({ status: 200, description: "Audit logs for the action type" })
  @ApiResponse({ status: 403, description: "Forbidden - Admin only" })
  findByAction(
    @Param("action") action: AuditAction,
    @CurrentUser("familyId") familyId: string,
    @Query("limit", new DefaultValuePipe(50), ParseIntPipe) limit: number,
    @Query("offset", new DefaultValuePipe(0), ParseIntPipe) offset: number,
  ) {
    return this.auditService.findByAction(action, familyId, limit, offset);
  }

  @Get(":id")
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: "Get a specific audit log by ID (Admin only)" })
  @ApiResponse({ status: 200, description: "Audit log details" })
  @ApiResponse({ status: 403, description: "Forbidden - Admin only" })
  @ApiResponse({ status: 404, description: "Audit log not found" })
  findOne(@Param("id") id: string, @CurrentUser("familyId") familyId: string) {
    return this.auditService.findOne(id, familyId);
  }
}
