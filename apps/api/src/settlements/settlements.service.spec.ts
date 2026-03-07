import { ForbiddenException, BadRequestException } from "@nestjs/common";
import { SettlementsService } from "./settlements.service";

describe("SettlementsService", () => {
  const familyId = "f1";
  const closedPeriod = {
    id: "2026-01",
    familyId,
    status: "CLOSED",
    settlementData: null,
    invoices: [
      {
        totalCents: 1000,
        shares: [
          { userId: "u1", shareCents: 500 },
          { userId: "u2", shareCents: 500 },
        ],
        payments: [{ paidById: "u2", amountCents: 1000 }],
      },
    ],
  } as any;

  function buildService() {
    const periodData = new Map<string, any>([["2026-01", { entries: [], plans: [] }]]);
    const prisma: any = {
      period: {
        findFirst: jest.fn(async ({ where }: any) => {
          if (where.id === "2026-01") return { ...closedPeriod, settlementData: periodData.get("2026-01") };
          return null;
        }),
        update: jest.fn(async ({ where, data }: any) => {
          periodData.set(where.id, data.settlementData);
          return { id: where.id };
        }),
        findMany: jest.fn(async () => [
          { ...closedPeriod, settlementData: periodData.get("2026-01") },
        ]),
      },
    };

    return { service: new SettlementsService(prisma), prisma, periodData };
  }

  it("rejects entry creation for non-admin", async () => {
    const { service } = buildService();
    await expect(
      service.createEntry(
        {
          periodId: "2026-01",
          fromUserId: "u1",
          toUserId: "u2",
          type: "payment",
          amountCents: 100,
        },
        familyId,
        { userId: "u1", role: "ADULT" },
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it("requires reversal comment", async () => {
    const { service, periodData } = buildService();
    periodData.set("2026-01", {
      entries: [
        {
          id: "e1",
          familyId,
          periodId: "2026-01",
          fromUserId: "u1",
          toUserId: "u2",
          type: "payment",
          amountCents: 100,
          effectiveDate: new Date().toISOString(),
          createdBy: "admin",
          createdAt: new Date().toISOString(),
        },
      ],
      plans: [],
    });

    await expect(
      service.reverseEntry(
        "2026-01",
        "e1",
        { comment: "" },
        familyId,
        { userId: "admin", role: "ADMIN" },
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it("creates summary with base obligation", async () => {
    const { service } = buildService();
    const summary = await service.getPeriodSummary("2026-01", familyId);
    expect(summary.rows.length).toBeGreaterThan(0);
    const pair = summary.rows.find((row) => row.fromUserId === "u1" && row.toUserId === "u2");
    expect(pair?.baseObligationCents).toBeGreaterThan(0);
  });
});
