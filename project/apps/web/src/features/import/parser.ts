import { strFromU8, unzipSync } from "fflate";
import { ParsedSheet, SpreadsheetFormat } from "./types";
import { normalizeHeader } from "./pipeline";

export function parseCsvText(text: string): string[][] {
  const delimiterCandidates = [",", ";", "\t", "|"];
  const firstLine = text.split(/\r?\n/, 1)[0] ?? "";
  const delimiter =
    delimiterCandidates
      .map((candidate) => ({
        candidate,
        count: (firstLine.match(new RegExp(`\\${candidate}`, "g")) ?? [])
          .length,
      }))
      .sort((a, b) => b.count - a.count)[0]?.candidate ?? ",";

  const rows: string[][] = [];
  let row: string[] = [];
  let value = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        value += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (!inQuotes && char === delimiter) {
      row.push(value.trim());
      value = "";
      continue;
    }

    if (!inQuotes && (char === "\n" || char === "\r")) {
      if (char === "\r" && nextChar === "\n") i += 1;
      row.push(value.trim());
      rows.push(row);
      row = [];
      value = "";
      continue;
    }

    value += char;
  }

  if (value.length > 0 || row.length > 0) {
    row.push(value.trim());
    rows.push(row);
  }

  return rows.filter((r) => r.some((c) => c.trim().length > 0));
}

export function detectHeaderRow(matrix: string[][]): number {
  return Math.max(
    0,
    matrix.findIndex(
      (row) => row.filter((cell) => cell.trim().length > 0).length >= 2,
    ),
  );
}

export function matrixToParsed(matrix: string[][]): ParsedSheet {
  const headerIndex = detectHeaderRow(matrix);
  const rawHeaders = matrix[headerIndex] ?? [];
  const headers = rawHeaders.map((h, i) =>
    normalizeHeader(h || `column_${i + 1}`),
  );
  const rows = matrix.slice(headerIndex + 1).map((row) => {
    const obj: Record<string, string> = {};
    headers.forEach((header, idx) => {
      obj[header] = (row[idx] ?? "").trim();
    });
    return obj;
  });

  return {
    headers,
    rows: rows.filter((row) => Object.values(row).some(Boolean)),
  };
}

function parseXlsx(buffer: Uint8Array): string[][] {
  const files = unzipSync(buffer);
  const workbookFile = files["xl/workbook.xml"];
  const workbookRelFile = files["xl/_rels/workbook.xml.rels"];
  if (!workbookFile || !workbookRelFile) return [];

  const workbook = strFromU8(workbookFile);
  const workbookDoc = new DOMParser().parseFromString(
    workbook,
    "application/xml",
  );
  const firstSheet = workbookDoc.querySelector("sheet");
  if (!firstSheet) return [];

  const relId = firstSheet.getAttribute("r:id");
  const rels = strFromU8(workbookRelFile);
  const relsDoc = new DOMParser().parseFromString(rels, "application/xml");
  const relationship = relsDoc.querySelector(`Relationship[Id='${relId}']`);
  const target =
    relationship?.getAttribute("Target") ?? "worksheets/sheet1.xml";
  const normalizedTarget = target.startsWith("/")
    ? target.slice(1)
    : `xl/${target}`;
  const sheetFile = files[normalizedTarget];
  if (!sheetFile) return [];

  const sheetDoc = new DOMParser().parseFromString(
    strFromU8(sheetFile),
    "application/xml",
  );
  const sharedStringsFile = files["xl/sharedStrings.xml"];
  const sharedStrings = sharedStringsFile
    ? Array.from(
        new DOMParser()
          .parseFromString(strFromU8(sharedStringsFile), "application/xml")
          .querySelectorAll("si t"),
      ).map((node) => node.textContent ?? "")
    : [];

  return Array.from(sheetDoc.querySelectorAll("sheetData row")).map((row) =>
    Array.from(row.querySelectorAll("c")).map((cell) => {
      const type = cell.getAttribute("t");
      const value =
        cell.querySelector("v")?.textContent ??
        cell.querySelector("is t")?.textContent ??
        "";
      if (type === "s") return sharedStrings[Number(value)] ?? "";
      return value;
    }),
  );
}

function parseOds(buffer: Uint8Array): string[][] {
  const files = unzipSync(buffer);
  const content = files["content.xml"];
  if (!content) return [];
  const doc = new DOMParser().parseFromString(
    strFromU8(content),
    "application/xml",
  );
  const firstTable = doc.getElementsByTagName("table:table")[0];
  if (!firstTable) return [];
  const rows = Array.from(firstTable.getElementsByTagName("table:table-row"));
  return rows.map((rowNode) => {
    const cells = Array.from(rowNode.getElementsByTagName("table:table-cell"));
    return cells.map((cell) => {
      const textNode = cell.getElementsByTagName("text:p")[0];
      return (textNode?.textContent ?? "").replace(/\s+/g, " ").trim();
    });
  });
}

export async function parseSpreadsheet(file: File): Promise<ParsedSheet> {
  const ext = file.name.split(".").pop()?.toLowerCase() as
    | SpreadsheetFormat
    | undefined;
  if (!ext || !["csv", "xlsx", "ods"].includes(ext)) {
    throw new Error("Unsupported file format");
  }

  if (ext === "csv") {
    return matrixToParsed(parseCsvText(await file.text()));
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const matrix = ext === "xlsx" ? parseXlsx(bytes) : parseOds(bytes);
  return matrixToParsed(matrix);
}
