import { IsString, IsEnum, IsNotEmpty } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

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
}
