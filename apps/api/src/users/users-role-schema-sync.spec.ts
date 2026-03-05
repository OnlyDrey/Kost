import { readFileSync } from "fs";
import { resolve } from "path";

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

describe("users role constants stay aligned with Prisma schema", () => {
  it("UserRole enum values match schema.prisma", () => {
    const schema = readFileSync(resolve(__dirname, "../../prisma/schema.prisma"), "utf8");
    const schemaValues = enumValues(schema, "UserRole");

    expect(schemaValues).toEqual(["ADMIN", "ADULT", "CHILD"]);
  });
});
