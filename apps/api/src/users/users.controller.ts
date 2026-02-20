import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { UsersService } from "./users.service";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { Roles } from "../common/decorators/roles.decorator";
import {
  CurrentUser,
  JwtPayload,
} from "../common/decorators/current-user.decorator";
import { UserRole } from "@prisma/client";

@ApiTags("users")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: "Get all users in the family" })
  @ApiResponse({ status: 200, description: "List of users" })
  findAll(@CurrentUser("familyId") familyId: string) {
    return this.usersService.findAll(familyId);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get a specific user by ID" })
  @ApiResponse({ status: 200, description: "User details" })
  @ApiResponse({ status: 404, description: "User not found" })
  findOne(@Param("id") id: string, @CurrentUser("familyId") familyId: string) {
    return this.usersService.findOne(id, familyId);
  }

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: "Create a new user (Admin only)" })
  @ApiResponse({ status: 201, description: "User created successfully" })
  @ApiResponse({ status: 403, description: "Forbidden - Admin only" })
  @ApiResponse({ status: 409, description: "User with username already exists" })
  create(
    @Body() createUserDto: CreateUserDto,
    @CurrentUser("familyId") familyId: string,
  ) {
    return this.usersService.create(createUserDto, familyId);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update a user" })
  @ApiResponse({ status: 200, description: "User updated successfully" })
  @ApiResponse({ status: 403, description: "Forbidden" })
  @ApiResponse({ status: 404, description: "User not found" })
  update(
    @Param("id") id: string,
    @Body() updateUserDto: UpdateUserDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.usersService.update(
      id,
      updateUserDto,
      user.familyId,
      user.sub,
      user.role as UserRole,
    );
  }

  @Delete(":id")
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: "Delete a user (Admin only)" })
  @ApiResponse({ status: 200, description: "User deleted successfully" })
  @ApiResponse({ status: 403, description: "Forbidden - Admin only" })
  @ApiResponse({ status: 404, description: "User not found" })
  remove(@Param("id") id: string, @CurrentUser("familyId") familyId: string) {
    return this.usersService.remove(id, familyId);
  }
}
