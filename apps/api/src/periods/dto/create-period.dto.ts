import { IsString, IsNotEmpty, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePeriodDto {
  @ApiProperty({ example: '2024-01', description: 'Period ID in YYYY-MM format' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{4}-\d{2}$/, {
    message: 'Period ID must be in YYYY-MM format',
  })
  id: string;
}
