import { ApiPropertyOptional, ApiProperty } from "@nestjs/swagger";
import { IsInt, IsOptional, IsString, Min } from "class-validator";

export class UpdateSettlementEntryDto {
  @ApiProperty({ description: "Updated amount in cents" })
  @IsInt()
  @Min(1)
  amountCents!: number;

  @ApiPropertyOptional({ description: "Optional updated comment" })
  @IsString()
  @IsOptional()
  comment?: string;
}
