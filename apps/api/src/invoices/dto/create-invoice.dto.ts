import { IsString, IsNotEmpty, IsInt, Min, IsEnum, IsOptional, IsDateString, ValidateNested, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DistributionMethod, RemainderMethod } from '@prisma/client';
import { Type } from 'class-transformer';

export class InvoiceLineDto {
  @ApiProperty({ example: 'Line item description' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ example: 10000, description: 'Amount in cents' })
  @IsInt()
  @Min(0)
  amountCents: number;
}

export class PercentRuleDto {
  @ApiProperty({ example: 'user123' })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({ example: 5000, description: 'Percentage in basis points (5000 = 50%)' })
  @IsInt()
  @Min(0)
  percentBasisPoints: number;
}

export class FixedRuleDto {
  @ApiProperty({ example: 'user123' })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({ example: 10000, description: 'Fixed amount in cents' })
  @IsInt()
  @Min(0)
  fixedCents: number;
}

export class DistributionRulesDto {
  @ApiPropertyOptional({ type: [PercentRuleDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PercentRuleDto)
  @IsOptional()
  percentRules?: PercentRuleDto[];

  @ApiPropertyOptional({ type: [FixedRuleDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FixedRuleDto)
  @IsOptional()
  fixedRules?: FixedRuleDto[];

  @ApiPropertyOptional({ enum: RemainderMethod })
  @IsEnum(RemainderMethod)
  @IsOptional()
  remainderMethod?: RemainderMethod;
}

export class CreateInvoiceDto {
  @ApiProperty({ example: '2024-01' })
  @IsString()
  @IsNotEmpty()
  periodId: string;

  @ApiProperty({ example: 'Utilities' })
  @IsString()
  @IsNotEmpty()
  category: string;

  @ApiProperty({ example: 'Electric Company' })
  @IsString()
  @IsNotEmpty()
  vendor: string;

  @ApiPropertyOptional({ example: 'January electricity bill' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: '2024-01-31' })
  @IsDateString()
  @IsOptional()
  dueDate?: string;

  @ApiProperty({ example: 50000, description: 'Total amount in cents' })
  @IsInt()
  @Min(0)
  totalCents: number;

  @ApiProperty({ enum: DistributionMethod, example: DistributionMethod.BY_INCOME })
  @IsEnum(DistributionMethod)
  distributionMethod: DistributionMethod;

  @ApiPropertyOptional({ type: [InvoiceLineDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InvoiceLineDto)
  @IsOptional()
  lines?: InvoiceLineDto[];

  @ApiPropertyOptional({ type: DistributionRulesDto })
  @ValidateNested()
  @Type(() => DistributionRulesDto)
  @IsOptional()
  distributionRules?: DistributionRulesDto;
}
