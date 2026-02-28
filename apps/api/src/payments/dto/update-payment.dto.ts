import { IsDateString, IsInt, IsOptional, IsString, IsUUID, Min } from "class-validator";

export class UpdatePaymentDto {
  @IsOptional()
  @IsUUID()
  paidById?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  amountCents?: number;

  @IsOptional()
  @IsDateString()
  paidAt?: string;

  @IsOptional()
  @IsString()
  note?: string;
}
