import { IsString, IsNotEmpty } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class MagicLinkVerifyDto {
  @ApiProperty({ example: "abc123token..." })
  @IsString()
  @IsNotEmpty()
  token: string;
}
