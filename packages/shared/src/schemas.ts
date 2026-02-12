import { z } from 'zod';
import { DistributionMethod, RemainderMethod, IncomeType } from './types';

export const PercentRuleSchema = z.object({
  userId: z.string(),
  percentBasisPoints: z.number().int().min(0).max(10000),
});

export const FixedRuleSchema = z.object({
  userId: z.string(),
  fixedCents: z.number().int().min(0),
});

export const CreateInvoiceSchema = z.object({
  periodId: z.string().regex(/^\d{4}-\d{2}$/),
  category: z.string().min(1).max(100),
  vendor: z.string().min(1).max(200),
  description: z.string().max(500).optional(),
  dueDate: z.string().datetime().optional(),
  totalCents: z.number().int().positive(),
  distributionMethod: z.nativeEnum(DistributionMethod),
  percentRules: z.array(PercentRuleSchema).optional(),
  fixedRules: z.array(FixedRuleSchema).optional(),
  remainderMethod: z.nativeEnum(RemainderMethod).optional(),
  lines: z.array(z.object({
    description: z.string().min(1).max(200),
    amountCents: z.number().int().positive(),
  })).optional(),
});

export const CreatePaymentSchema = z.object({
  amountCents: z.number().int().positive(),
  paidAt: z.string().datetime().optional(),
  note: z.string().max(500).optional(),
});

export const UpsertIncomeSchema = z.object({
  inputType: z.nativeEnum(IncomeType),
  inputCents: z.number().int().min(0),
});

export const InviteUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(100),
  role: z.enum(['ADULT', 'JUNIOR']),
});
