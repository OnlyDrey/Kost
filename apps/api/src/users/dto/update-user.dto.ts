import { IsString, IsEnum, IsOptional, MinLength } from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";

enum UserRole {
  ADMIN = "ADMIN",
  ADULT = "ADULT",
  JUNIOR = "JUNIOR",
}

export class UpdateUserDto {
  @ApiPropertyOptional({ example: "admin" })
  @IsString()
  @IsOptional()
  username?: string;

  @ApiPropertyOptional({ example: "John Doe" })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ enum: UserRole, example: UserRole.ADULT })
  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;

  @ApiPropertyOptional({ example: "newpassword", minLength: 6 })
  @IsString()
  @IsOptional()
  @MinLength(6)
  password?: string;

  @ApiPropertyOptional({ example: "https://example.com/avatar.jpg" })
  @IsString()
  @IsOptional()
  avatarUrl?: string | null;
}
