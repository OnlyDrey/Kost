import {
  Controller,
  Post,
  Body,
  Get,
  Delete,
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
  ApiBody,
} from "@nestjs/swagger";
import { Request, Response } from "express";
import { AuthService } from "./auth.service";
import { PasswordLoginDto } from "./dto/password-login.dto";
import { PasswordRegisterDto } from "./dto/password-register.dto";
import { DeleteAccountDto } from "./dto/delete-account.dto";
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

  private getCookieOptions(request: Request) {
    const cookieSecure = this.configService.get<boolean>("cookieSecure");
    const forwardedProto = request.headers["x-forwarded-proto"];
    const isForwardedHttps =
      typeof forwardedProto === "string"
        ? forwardedProto.split(",")[0].trim() === "https"
        : false;

    // Prevent accidental lockout when COOKIE_SECURE=true in local HTTP environments.
    const secure = cookieSecure ? request.secure || isForwardedHttps : false;

    const sameSite: "lax" | "strict" | "none" = secure ? "strict" : "lax";

    return {
      httpOnly: true,
      secure,
      sameSite,
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    };
  }

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

    response.cookie(
      "access_token",
      result.accessToken,
      this.getCookieOptions(response.req),
    );

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
      dto.twoFactorCode,
      dto.recoveryCode,
    );

    response.cookie(
      "access_token",
      result.accessToken,
      this.getCookieOptions(response.req),
    );

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
    response.clearCookie("access_token", { path: "/" });
    return { message: "Logout successful" };
  }

  @UseGuards(JwtAuthGuard)
  @Post("change-password")
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Change current user password" })
  @ApiResponse({ status: 200, description: "Password changed successfully" })
  @ApiResponse({ status: 400, description: "Current password is incorrect" })
  async changePassword(
    @CurrentUser("sub") userId: string,
    @Body() body: { currentPassword: string; newPassword: string },
  ) {
    return this.authService.changePassword(
      userId,
      body.currentPassword,
      body.newPassword,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Delete("me")
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Delete current user account" })
  @ApiResponse({ status: 200, description: "Account deleted successfully" })
  @ApiResponse({ status: 400, description: "Password is incorrect" })
  @ApiBody({ type: DeleteAccountDto })
  async deleteMyAccount(
    @CurrentUser("sub") userId: string,
    @Body() body: DeleteAccountDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.deleteMyAccount(
      userId,
      body.currentPassword,
    );
    response.clearCookie("access_token", { path: "/" });
    return result;
  }
  @UseGuards(JwtAuthGuard)
  @Get("2fa/status")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get current 2FA status" })
  async getTwoFactorStatus(@CurrentUser("sub") userId: string) {
    return this.authService.getTwoFactorStatus(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post("2fa/setup")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Set up TOTP 2FA and recovery codes" })
  async setupTwoFactor(@CurrentUser("sub") userId: string) {
    return this.authService.setupTwoFactor(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post("2fa/enable")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Enable TOTP 2FA" })
  async enableTwoFactor(
    @CurrentUser("sub") userId: string,
    @Body() body: { code: string },
  ) {
    return this.authService.enableTwoFactor(userId, body.code);
  }

  @UseGuards(JwtAuthGuard)
  @Post("2fa/disable")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Disable 2FA" })
  async disableTwoFactor(
    @CurrentUser("sub") userId: string,
    @Body() body: { currentPassword: string },
  ) {
    return this.authService.disableTwoFactor(userId, body.currentPassword);
  }

  @UseGuards(JwtAuthGuard)
  @Post("2fa/recovery-codes/regenerate")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Regenerate 2FA recovery codes" })
  async regenerateRecoveryCodes(
    @CurrentUser("sub") userId: string,
    @Body() body: { currentPassword: string },
  ) {
    return this.authService.regenerateRecoveryCodes(
      userId,
      body.currentPassword,
    );
  }

}
