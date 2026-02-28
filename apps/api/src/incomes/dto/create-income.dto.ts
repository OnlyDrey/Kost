import { IsEnum, IsInt, Min, IsNotEmpty, IsString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { IncomeType } from "@prisma/client";

export class CreateIncomeDto {
  @ApiProperty({ example: "user123" })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({ example: "2024-01" })
  @IsString()
  @IsNotEmpty()
  periodId: string;

  @ApiProperty({ enum: IncomeType, example: IncomeType.MONTHLY_GROSS })
  @IsEnum(IncomeType)
  inputType: IncomeType;

  @ApiProperty({ example: 500000, description: "Income amount in cents" })
  @IsInt()
  @Min(0)
  inputCents: number;
}
