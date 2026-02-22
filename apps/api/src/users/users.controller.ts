import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { diskStorage } from "multer";
import { extname, join } from "path";

type MulterFile = { filename: string; originalname: string; mimetype: string; size: number };
import { mkdirSync } from "fs";
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

  @Post(":id/avatar")
  @ApiOperation({ summary: "Upload avatar image for a user" })
  @UseInterceptors(
    FileInterceptor("avatar", {
      storage: diskStorage({
        destination: (_req, _file, cb) => {
          const dir = join(process.cwd(), "uploads", "avatars");
          mkdirSync(dir, { recursive: true });
          cb(null, dir);
        },
        filename: (req, file, cb) => {
          const ext = extname(file.originalname).toLowerCase() || ".jpg";
          cb(null, `${req.params.id}${ext}`);
        },
      }),
      fileFilter: (_req, file, cb) => {
        if (!file.mimetype.startsWith("image/")) {
          cb(new BadRequestException("Only image files are allowed"), false);
        } else {
          cb(null, true);
        }
      },
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  uploadAvatar(
    @Param("id") id: string,
    @UploadedFile() file: MulterFile,
    @CurrentUser() currentUser: JwtPayload,
  ) {
    if (!file) throw new BadRequestException("No file uploaded");
    return this.usersService.uploadAvatar(
      id,
      file,
      currentUser.familyId,
      currentUser.sub,
      currentUser.role as UserRole,
    );
  }

  @Delete(":id/avatar")
  @ApiOperation({ summary: "Remove avatar for a user" })
  removeAvatar(
    @Param("id") id: string,
    @CurrentUser() currentUser: JwtPayload,
  ) {
    return this.usersService.removeAvatar(
      id,
      currentUser.familyId,
      currentUser.sub,
      currentUser.role as UserRole,
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
