import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsIn, IsInt, IsNotEmpty, IsOptional, IsString, Min } from "class-validator";

export class CreateSettlementPlanDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  sourcePeriodId!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  fromUserId!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  toUserId!: string;

  @ApiProperty({ enum: ["full_next_period", "fixed_amount_per_period", "fixed_number_of_periods"] })
  @IsIn(["full_next_period", "fixed_amount_per_period", "fixed_number_of_periods"])
  planType!: "full_next_period" | "fixed_amount_per_period" | "fixed_number_of_periods";

  @ApiPropertyOptional({ description: "Required for fixed_amount_per_period" })
  @IsInt()
  @Min(1)
  @IsOptional()
  configuredAmountCents?: number;

  @ApiPropertyOptional({ description: "Required for fixed_number_of_periods" })
  @IsInt()
  @Min(1)
  @IsOptional()
  configuredPeriodCount?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  startPeriodId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  comment?: string;
}
