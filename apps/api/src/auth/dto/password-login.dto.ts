import { IsString, IsNotEmpty, MinLength } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class PasswordLoginDto {
  @ApiProperty({ example: "admin" })
  @IsString()
  @IsNotEmpty()
  username: string;

  @ApiProperty({ example: "password123", minLength: 8 })
  @IsString()
  @MinLength(8, { message: "Password must be at least 8 characters long" })
  password: string;
}
