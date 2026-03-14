import {
  calcPaidSum,
  calcPaymentStatus,
  calcRemaining,
} from "./payment-status.util";

describe("payment status helpers", () => {
  it("calculates paid sum and remaining", () => {
    const paid = calcPaidSum([{ amountCents: 5000 }, { amountCents: 150 }]);

    expect(paid).toBe(5150);
    expect(calcRemaining(12150, paid)).toBe(7000);
  });

  it("returns unpaid when sum is zero", () => {
    expect(calcPaymentStatus(12150, 0)).toBe("UNPAID");
  });

  it("returns partially paid when sum is between zero and total", () => {
    expect(calcPaymentStatus(12150, 5000)).toBe("PARTIALLY_PAID");
  });

  it("returns paid when sum is equal or above total", () => {
    expect(calcPaymentStatus(6000, 6000)).toBe("PAID");
    expect(calcPaymentStatus(6000, 7000)).toBe("PAID");
    expect(calcRemaining(6000, 7000)).toBe(0);
  });

  it("covers edit after deleting payment scenario", () => {
    const originalTotal = 12150;
    const fullyPaid = 12150;

    expect(calcPaymentStatus(originalTotal, fullyPaid)).toBe("PAID");

    const afterDelete = 0;
    expect(calcPaymentStatus(originalTotal, afterDelete)).toBe("UNPAID");

    const updatedTotal = 20000;
    expect(calcPaymentStatus(updatedTotal, afterDelete)).toBe("UNPAID");

    const newPayment = 5000;
    expect(calcPaymentStatus(updatedTotal, newPayment)).toBe("PARTIALLY_PAID");

    const lowerTotal = 6000;
    expect(calcPaymentStatus(lowerTotal, newPayment)).toBe("PARTIALLY_PAID");
    expect(calcRemaining(lowerTotal, newPayment)).toBe(1000);
  });
});
