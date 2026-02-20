import { IsString, IsEnum, IsOptional } from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";
import { UserRole } from "@prisma/client";

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
}
