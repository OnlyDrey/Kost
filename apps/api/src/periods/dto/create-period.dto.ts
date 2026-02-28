import { IsString, IsNotEmpty, Matches, IsOptional, IsBoolean } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CreatePeriodDto {
  @ApiProperty({
    example: "2024-01",
    description: "Period ID in YYYY-MM format",
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{4}-\d{2}$/, {
    message: "Period ID must be in YYYY-MM format",
  })
  id: string;

  @ApiPropertyOptional({
    description: "Automatically import active subscriptions into the new period if incomes exist",
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  autoImportSubscriptions?: boolean;
}
