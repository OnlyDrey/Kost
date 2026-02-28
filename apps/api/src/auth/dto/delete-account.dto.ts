import { ApiProperty } from "@nestjs/swagger";
import { IsString, MinLength } from "class-validator";

export class DeleteAccountDto {
  @ApiProperty({
    description: "Current password used to confirm account deletion",
    minLength: 6,
    example: "MyCurrentPassword123",
  })
  @IsString()
  @MinLength(6)
  currentPassword: string;
}
