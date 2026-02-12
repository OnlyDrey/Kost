import { IsEnum, IsInt, Min, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IncomeType } from '@prisma/client';

export class UpdateIncomeDto {
  @ApiPropertyOptional({ enum: IncomeType, example: IncomeType.MONTHLY_GROSS })
  @IsEnum(IncomeType)
  @IsOptional()
  inputType?: IncomeType;

  @ApiPropertyOptional({ example: 500000, description: 'Income amount in cents' })
  @IsInt()
  @Min(0)
  @IsOptional()
  inputCents?: number;
}
