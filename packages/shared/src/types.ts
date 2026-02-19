// Shared types and enums for Kost

export enum UserRole {
  ADMIN = 'ADMIN',
  ADULT = 'ADULT',
  JUNIOR = 'JUNIOR',
}

export enum PeriodStatus {
  OPEN = 'OPEN',
  CLOSED = 'CLOSED',
}

export enum InvoiceStatus {
  UNPAID = 'UNPAID',
  PARTIALLY_PAID = 'PARTIALLY_PAID',
  PAID = 'PAID',
}

export enum DistributionMethod {
  BY_PERCENT = 'BY_PERCENT',
  BY_INCOME = 'BY_INCOME',
  FIXED = 'FIXED',
}

export enum RemainderMethod {
  EQUAL = 'EQUAL',
  BY_INCOME = 'BY_INCOME',
}

export enum IncomeType {
  MONTHLY_GROSS = 'MONTHLY_GROSS',
  MONTHLY_NET = 'MONTHLY_NET',
  ANNUAL_GROSS = 'ANNUAL_GROSS',
  ANNUAL_NET = 'ANNUAL_NET',
}

export enum AuditAction {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  PERIOD_CLOSE = 'PERIOD_CLOSE',
  PERIOD_REOPEN = 'PERIOD_REOPEN',
  INVITE_USER = 'INVITE_USER',
}

export interface PercentRule {
  userId: string;
  percentBasisPoints: number; // 10000 = 100%
}

export interface FixedRule {
  userId: string;
  fixedCents: number;
}

export interface AllocationShare {
  userId: string;
  shareCents: number;
  explanation: string;
}

export interface Transfer {
  fromUserId: string;
  toUserId: string;
  amountCents: number;
}

export interface Balance {
  userId: string;
  netCents: number; // positive = should receive, negative = should pay
}
