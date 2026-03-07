import { strFromU8, unzipSync } from "fflate";
import { ParsedSheet, SpreadsheetFormat } from "./types";
import { normalizeHeader } from "./pipeline";

function parseCsvText(text: string): string[][] {
  const delimiterCandidates = [",", ";", "\t", "|"];
  const firstLine = text.split(/\r?\n/, 1)[0] ?? "";
  const delimiter = delimiterCandidates
    .map((candidate) => ({ candidate, count: (firstLine.match(new RegExp(`\\${candidate}`, "g")) ?? []).length }))
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

function detectHeaderRow(matrix: string[][]): number {
  return Math.max(
    0,
    matrix.findIndex((row) => row.filter((cell) => cell.trim().length > 0).length >= 2),
  );
}

function matrixToParsed(matrix: string[][]): ParsedSheet {
  const headerIndex = detectHeaderRow(matrix);
  const rawHeaders = matrix[headerIndex] ?? [];
  const headers = rawHeaders.map((h, i) => normalizeHeader(h || `column_${i + 1}`));
  const rows = matrix.slice(headerIndex + 1).map((row) => {
    const obj: Record<string, string> = {};
    headers.forEach((header, idx) => {
      obj[header] = (row[idx] ?? "").trim();
    });
    return obj;
  });

  return { headers, rows: rows.filter((row) => Object.values(row).some(Boolean)) };
}

function parseXmlRows(xmlText: string, rowSelector: string, cellSelector: string): string[][] {
  const doc = new DOMParser().parseFromString(xmlText, "application/xml");
  const rowNodes = Array.from(doc.querySelectorAll(rowSelector));
  return rowNodes.map((rowNode) =>
    Array.from(rowNode.querySelectorAll(cellSelector)).map((cell) =>
      (cell.textContent ?? "").replace(/\s+/g, " ").trim(),
    ),
  );
}

function parseXlsx(buffer: Uint8Array): string[][] {
  const files = unzipSync(buffer);
  const workbook = strFromU8(files["xl/workbook.xml"]);
  const workbookDoc = new DOMParser().parseFromString(workbook, "application/xml");
  const firstSheet = workbookDoc.querySelector("sheet");
  if (!firstSheet) return [];

  const relId = firstSheet.getAttribute("r:id");
  const rels = strFromU8(files["xl/_rels/workbook.xml.rels"]);
  const relsDoc = new DOMParser().parseFromString(rels, "application/xml");
  const relationship = relsDoc.querySelector(`Relationship[Id='${relId}']`);
  const target = relationship?.getAttribute("Target") ?? "worksheets/sheet1.xml";
  const normalizedTarget = target.startsWith("/") ? target.slice(1) : `xl/${target}`;

  const sheet = strFromU8(files[normalizedTarget]);
  const sheetDoc = new DOMParser().parseFromString(sheet, "application/xml");
  const sharedStringsFile = files["xl/sharedStrings.xml"];
  const sharedStrings = sharedStringsFile
    ? Array.from(
        new DOMParser().parseFromString(strFromU8(sharedStringsFile), "application/xml").querySelectorAll("si t"),
      ).map((node) => node.textContent ?? "")
    : [];

  const rows = Array.from(sheetDoc.querySelectorAll("sheetData row")).map((row) => {
    return Array.from(row.querySelectorAll("c")).map((cell) => {
      const type = cell.getAttribute("t");
      const value = cell.querySelector("v")?.textContent ?? cell.querySelector("is t")?.textContent ?? "";
      if (type === "s") return sharedStrings[Number(value)] ?? "";
      return value;
    });
  });

  return rows;
}

function parseOds(buffer: Uint8Array): string[][] {
  const files = unzipSync(buffer);
  const content = files["content.xml"];
  if (!content) return [];
  return parseXmlRows(strFromU8(content), "table\\:table table\\:table-row", "table\\:table-cell text\\:p");
}

export async function parseSpreadsheet(file: File): Promise<ParsedSheet> {
  const ext = file.name.split(".").pop()?.toLowerCase() as SpreadsheetFormat | undefined;
  if (!ext || !["csv", "xlsx", "ods"].includes(ext)) {
    throw new Error("Unsupported file format");
  }

  if (ext === "csv") {
    const text = await file.text();
    return matrixToParsed(parseCsvText(text));
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const matrix = ext === "xlsx" ? parseXlsx(bytes) : parseOds(bytes);
  return matrixToParsed(matrix);
}
