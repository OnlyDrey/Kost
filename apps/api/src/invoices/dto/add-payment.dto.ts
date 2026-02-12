import { IsString, IsNotEmpty, IsInt, Min, IsOptional, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AddPaymentDto {
  @ApiProperty({ example: 'user123' })
  @IsString()
  @IsNotEmpty()
  paidById: string;

  @ApiProperty({ example: 25000, description: 'Payment amount in cents' })
  @IsInt()
  @Min(1)
  amountCents: number;

  @ApiPropertyOptional({ example: 'Paid via bank transfer' })
  @IsString()
  @IsOptional()
  note?: string;

  @ApiPropertyOptional({ example: '2024-01-15T10:00:00Z' })
  @IsDateString()
  @IsOptional()
  paidAt?: string;
}
