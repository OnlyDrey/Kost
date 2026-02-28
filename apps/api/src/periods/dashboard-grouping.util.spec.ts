import { defaultSelectedUserIdsForNewExpense, groupInvoiceSums, normalizeDashboardFilter } from "./dashboard-grouping.util";

describe("dashboard grouping logic", () => {
  it("uses original / remaining / paid sums per group", () => {
    const sums = groupInvoiceSums([
      { totalCents: 10000, payments: [] },
      { totalCents: 10000, payments: [{ amountCents: 2500 }] },
      { totalCents: 10000, payments: [{ amountCents: 10000 }] },
    ]);

    expect(sums.unpaid).toBe(10000);
    expect(sums.partial).toBe(7500);
    expect(sums.paid).toBe(10000);
  });

  it("normalizes filter route params", () => {
    expect(normalizeDashboardFilter("paid")).toBe("paid");
    expect(normalizeDashboardFilter("remaining")).toBe("remaining");
    expect(normalizeDashboardFilter("all")).toBe("all");
    expect(normalizeDashboardFilter("x")).toBe("all");
    expect(normalizeDashboardFilter(null)).toBe("all");
  });

  it("defaults to no preselected users for new expense", () => {
    expect(defaultSelectedUserIdsForNewExpense()).toEqual([]);
  });
});
