import { isPeriodClosed } from "./period-status.util";

describe("isPeriodClosed", () => {
  it("returns true when status is CLOSED", () => {
    expect(isPeriodClosed({ status: "CLOSED" })).toBe(true);
  });

  it("returns true when closedAt is set", () => {
    expect(isPeriodClosed({ status: "OPEN", closedAt: "2026-02-01T00:00:00.000Z" })).toBe(true);
  });

  it("returns false for open period without closedAt", () => {
    expect(isPeriodClosed({ status: "OPEN" })).toBe(false);
  });
});
