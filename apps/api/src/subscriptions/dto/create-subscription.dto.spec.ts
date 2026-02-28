import { ValidationPipe } from "@nestjs/common";
import { CreateSubscriptionDto } from "./create-subscription.dto";

describe("CreateSubscriptionDto validation", () => {
  it("keeps nested distributionRules values when whitelist is enabled", async () => {
    const pipe = new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    });

    const payload = {
      name: "Tryg Forsikring",
      vendor: "Tryg",
      amountCents: 65238,
      frequency: "MONTHLY",
      dayOfMonth: 1,
      startDate: "2026-02-01",
      distributionMethod: "BY_PERCENT",
      distributionRules: {
        userIds: ["user-a", "user-b"],
        percentRules: [
          { userId: "user-a", percentBasisPoints: 5700 },
          { userId: "user-b", percentBasisPoints: 4300 },
        ],
      },
      unknownTopLevel: "removed",
    };

    const transformed = (await pipe.transform(payload, {
      type: "body",
      metatype: CreateSubscriptionDto,
    })) as CreateSubscriptionDto & { unknownTopLevel?: string };

    expect(transformed.unknownTopLevel).toBeUndefined();
    expect(transformed.distributionRules).toEqual(payload.distributionRules);
  });
});
