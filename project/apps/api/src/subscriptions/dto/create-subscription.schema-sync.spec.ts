import { readFileSync } from "fs";
import { resolve } from "path";
import {
  DistributionMethod,
  SubscriptionStatus,
} from "./create-subscription.dto";

function enumValues(schema: string, enumName: string): string[] {
  const rx = new RegExp(`enum\\s+${enumName}\\s*\\{([\\s\\S]*?)\\n\\}`, "m");
  const match = schema.match(rx);
  if (!match) {
    throw new Error(`Enum ${enumName} not found in schema.prisma`);
  }

  return match[1]
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("//"));
}

describe("CreateSubscriptionDto enums stay aligned with Prisma schema", () => {
  const schema = readFileSync(resolve(__dirname, "../../../prisma/schema.prisma"), "utf8");

  it("DistributionMethod values match schema.prisma", () => {
    const schemaValues = enumValues(schema, "DistributionMethod");
    expect(Object.values(DistributionMethod)).toEqual(schemaValues);
  });

  it("SubscriptionStatus values match schema.prisma", () => {
    const schemaValues = enumValues(schema, "SubscriptionStatus");
    expect(Object.values(SubscriptionStatus)).toEqual(schemaValues);
  });
});
