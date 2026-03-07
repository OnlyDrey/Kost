import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsDateString, IsIn, IsInt, IsNotEmpty, IsOptional, IsString, Min } from "class-validator";

export class CreateSettlementEntryDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  periodId!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  fromUserId!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  toUserId!: string;

  @ApiProperty({ enum: ["payment", "adjustment", "write_down"] })
  @IsIn(["payment", "adjustment", "write_down"])
  type!: "payment" | "adjustment" | "write_down";

  @ApiProperty({ description: "Amount in cents" })
  @IsInt()
  @Min(1)
  amountCents!: number;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  effectiveDate?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  comment?: string;
}

export class ReverseSettlementEntryDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  comment!: string;
}
