import {
  IsString,
  IsNotEmpty,
  IsInt,
  Min,
  IsEnum,
  IsDateString,
  IsOptional,
  IsBoolean,
  IsObject,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { DistributionMethod, SubscriptionStatus } from "@prisma/client";

export class CreateSubscriptionDto {
  @ApiProperty({ example: "Netflix Subscription" })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: "Netflix" })
  @IsString()
  @IsNotEmpty()
  vendor!: string;

  @ApiPropertyOptional({ example: "Entertainment" })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiProperty({ example: 9900, description: "Amount in cents" })
  @IsInt()
  @Min(0)
  amountCents!: number;

  @ApiProperty({
    example: "monthly",
    description: "Frequency: monthly, yearly, etc.",
  })
  @IsString()
  @IsNotEmpty()
  frequency!: string;

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
  startDate!: string;

  @ApiPropertyOptional({ example: "2024-12-31" })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiProperty({
    enum: DistributionMethod,
    example: DistributionMethod.BY_INCOME,
  })
  @IsEnum(DistributionMethod)
  distributionMethod!: DistributionMethod;

  @ApiPropertyOptional({
    description:
      "Distribution rules (percentRules, fixedRules, remainderMethod, userIds)",
  })
  @IsObject()
  @IsOptional()
  distributionRules?: Record<string, unknown>;

  @ApiPropertyOptional({ example: "Premium" })
  @IsString()
  @IsOptional()
  plan?: string;

  @ApiPropertyOptional({ example: "Faktura" })
  @IsString()
  @IsOptional()
  paymentMethod?: string;

  @ApiPropertyOptional({
    description: "User id for personal recurring expense owner",
  })
  @IsString()
  @IsOptional()
  personalUserId?: string;

  @ApiPropertyOptional({ example: "2026-03-01" })
  @IsDateString()
  @IsOptional()
  nextBillingAt?: string;

  @ApiPropertyOptional({
    enum: SubscriptionStatus,
    example: SubscriptionStatus.ACTIVE,
  })
  @IsEnum(SubscriptionStatus)
  @IsOptional()
  status?: SubscriptionStatus;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  active?: boolean;
}
