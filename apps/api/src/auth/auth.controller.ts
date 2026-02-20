import {
  Controller,
  Post,
  Body,
  Get,
  Res,
  HttpCode,
  HttpStatus,
  UseGuards,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { Response } from "express";
import { AuthService } from "./auth.service";
import { PasswordLoginDto } from "./dto/password-login.dto";
import { PasswordRegisterDto } from "./dto/password-register.dto";
import { Public } from "../common/decorators/public.decorator";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { ConfigService } from "@nestjs/config";

@ApiTags("auth")
@Controller("auth")
export class AuthController {
  constructor(
    private authService: AuthService,
    private configService: ConfigService,
  ) {}

  @Public()
  @Post("register")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Register a new user with password" })
  @ApiResponse({ status: 201, description: "User registered successfully" })
  @ApiResponse({ status: 409, description: "User already exists" })
  async register(
    @Body() dto: PasswordRegisterDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.registerWithPassword(
      dto.name,
      dto.username,
      dto.password,
    );

    const cookieSecure = this.configService.get<boolean>("cookieSecure");
    response.cookie("access_token", result.accessToken, {
      httpOnly: true,
      secure: cookieSecure,
      sameSite: cookieSecure ? "strict" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return {
      message: "User registered successfully",
      user: result.user,
    };
  }

  @Public()
  @Post("login/password")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Login with username and password" })
  @ApiResponse({ status: 200, description: "Login successful" })
  @ApiResponse({ status: 401, description: "Invalid credentials" })
  async loginWithPassword(
    @Body() dto: PasswordLoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.loginWithPassword(
      dto.username,
      dto.password,
    );

    const cookieSecure = this.configService.get<boolean>("cookieSecure");
    response.cookie("access_token", result.accessToken, {
      httpOnly: true,
      secure: cookieSecure,
      sameSite: cookieSecure ? "strict" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return {
      message: "Login successful",
      user: result.user,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get("me")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get current authenticated user" })
  @ApiResponse({ status: 200, description: "Current user information" })
  async getCurrentUser(@CurrentUser("sub") userId: string) {
    return this.authService.getCurrentUser(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post("logout")
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Logout current user" })
  @ApiResponse({ status: 200, description: "Logout successful" })
  async logout(@Res({ passthrough: true }) response: Response) {
    response.clearCookie("access_token");
    return { message: "Logout successful" };
  }
}
