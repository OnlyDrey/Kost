import { BadRequestException } from "@nestjs/common";
import {
  DistributionMethod,
  IncomeType,
  SubscriptionStatus,
} from "@kost/shared";

const enumValues = <T extends string>(enumObj: Record<string, T>) =>
  new Set<T>(Object.values(enumObj));

const INCOME_TYPE_VALUES = enumValues(IncomeType);
const DISTRIBUTION_METHOD_VALUES = enumValues(DistributionMethod);
const SUBSCRIPTION_STATUS_VALUES = enumValues(SubscriptionStatus);

export function toIncomeType(value: unknown): IncomeType {
  if (typeof value === "string" && INCOME_TYPE_VALUES.has(value as IncomeType)) {
    return value as IncomeType;
  }
  throw new BadRequestException(`Unsupported income type: ${String(value)}`);
}

export function toDistributionMethod(value: unknown): DistributionMethod {
  if (
    typeof value === "string" &&
    DISTRIBUTION_METHOD_VALUES.has(value as DistributionMethod)
  ) {
    return value as DistributionMethod;
  }
  throw new BadRequestException(
    `Unsupported distribution method: ${String(value)}`,
  );
}

export function toSubscriptionStatus(value: unknown): SubscriptionStatus {
  if (
    typeof value === "string" &&
    SUBSCRIPTION_STATUS_VALUES.has(value as SubscriptionStatus)
  ) {
    return value as SubscriptionStatus;
  }
  throw new BadRequestException(`Unsupported subscription status: ${String(value)}`);
}
