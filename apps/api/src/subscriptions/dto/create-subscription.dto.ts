import {
  IsString,
  IsNotEmpty,
  IsInt,
  Min,
  IsEnum,
  IsDateString,
  IsOptional,
  IsBoolean,
  ValidateNested,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { DistributionMethod } from "@prisma/client";
import { Type } from "class-transformer";

export class CreateSubscriptionDto {
  @ApiProperty({ example: "Netflix Subscription" })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: "Netflix" })
  @IsString()
  @IsNotEmpty()
  vendor: string;

  @ApiProperty({ example: "Entertainment" })
  @IsString()
  @IsNotEmpty()
  category: string;

  @ApiProperty({ example: 9900, description: "Amount in cents" })
  @IsInt()
  @Min(0)
  amountCents: number;

  @ApiProperty({
    example: "monthly",
    description: "Frequency: monthly, yearly, etc.",
  })
  @IsString()
  @IsNotEmpty()
  frequency: string;

  @ApiPropertyOptional({
    example: 15,
    description: "Day of month when subscription renews (1-31)",
  })
  @IsInt()
  @Min(1)
  @IsOptional()
  dayOfMonth?: number;

  @ApiProperty({ example: "2024-01-01" })
  @IsDateString()
  startDate: string;

  @ApiPropertyOptional({ example: "2024-12-31" })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiProperty({
    enum: DistributionMethod,
    example: DistributionMethod.BY_INCOME,
  })
  @IsEnum(DistributionMethod)
  distributionMethod: DistributionMethod;

  @ApiProperty({
    description:
      "Distribution rules (percentRules, fixedRules, remainderMethod)",
  })
  @ValidateNested()
  @Type(() => Object)
  distributionRules: any;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  active?: boolean;
}
