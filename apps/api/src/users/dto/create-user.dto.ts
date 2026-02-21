import { IsString, IsEnum, IsNotEmpty, IsOptional, MinLength } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

enum UserRole {
  ADMIN = "ADMIN",
  ADULT = "ADULT",
}

export class CreateUserDto {
  @ApiProperty({ example: "admin" })
  @IsString()
  @IsNotEmpty()
  username: string;

  @ApiProperty({ example: "John Doe" })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ enum: UserRole, example: UserRole.ADULT })
  @IsEnum(UserRole)
  role: UserRole;

  @ApiPropertyOptional({ example: "password123", minLength: 6 })
  @IsString()
  @IsOptional()
  @MinLength(6)
  password?: string;
}
