import { IsString, IsNotEmpty, MinLength, IsOptional, Length } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class PasswordLoginDto {
  @ApiProperty({ example: "admin" })
  @IsString()
  @IsNotEmpty()
  username!: string;

  @ApiProperty({ example: "password123", minLength: 8 })
  @IsString()
  @MinLength(8, { message: "Password must be at least 8 characters long" })
  password!: string;

  @ApiProperty({
    example: "123456",
    required: false,
    description: "Required when two-factor authentication is enabled",
  })
  @IsOptional()
  @IsString()
  @Length(6, 6)
  twoFactorCode?: string;

  @ApiProperty({
    example: "a1b2c3d4",
    required: false,
    description: "Optional recovery code alternative when 2FA is enabled",
  })
  @IsOptional()
  @IsString()
  @Length(8, 8)
  recoveryCode?: string;
}
