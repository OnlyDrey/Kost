import { strToU8, zipSync } from "fflate";
import { ImportEntityType, SpreadsheetFormat } from "./types";

const TEMPLATE_COLUMNS: Record<ImportEntityType, string[]> = {
  expense: [
    "description",
    "amount",
    "due_date",
    "category",
    "vendor",
    "payment_method",
    "status",
    "notes",
  ],
  recurring: [
    "description",
    "default_amount",
    "due_day",
    "frequency",
    "category",
    "vendor",
    "payment_method",
    "active",
    "notes",
  ],
};

const TEMPLATE_EXAMPLE: Record<ImportEntityType, string[]> = {
  expense: ["Electricity", "1200.5", "2026-03-20", "Utilities", "Power Co", "Invoice", "UNPAID", ""] ,
  recurring: ["Netflix", "189", "15", "MONTHLY", "Entertainment", "Netflix", "Card", "true", ""],
};

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function toCsv(headers: string[], example: string[]) {
  return `${headers.join(",")}\n${example.join(",")}\n`;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function createXlsx(headers: string[], example: string[]): Uint8Array {
  const values = [headers, example];
  const rowsXml = values
    .map(
      (row, rowIndex) => `<row r="${rowIndex + 1}">${row
        .map(
          (cell, colIndex) =>
            `<c r="${String.fromCharCode(65 + colIndex)}${rowIndex + 1}" t="inlineStr"><is><t>${escapeXml(cell)}</t></is></c>`,
        )
        .join("")}</row>`,
    )
    .join("");

  const files = {
    "[Content_Types].xml": strToU8(`<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
</Types>`),
    "_rels/.rels": strToU8(`<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`),
    "xl/workbook.xml": strToU8(`<?xml version="1.0" encoding="UTF-8"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>
    <sheet name="Template" sheetId="1" r:id="rId1"/>
  </sheets>
</workbook>`),
    "xl/_rels/workbook.xml.rels": strToU8(`<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
</Relationships>`),
    "xl/worksheets/sheet1.xml": strToU8(`<?xml version="1.0" encoding="UTF-8"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${rowsXml}</sheetData></worksheet>`),
  };

  return zipSync(files);
}

function createOds(headers: string[], example: string[]): Uint8Array {
  const rows = [headers, example]
    .map(
      (row) =>
        `<table:table-row>${row
          .map((cell) => `<table:table-cell office:value-type="string"><text:p>${escapeXml(cell)}</text:p></table:table-cell>`)
          .join("")}</table:table-row>`,
    )
    .join("");

  return zipSync({
    mimetype: strToU8("application/vnd.oasis.opendocument.spreadsheet"),
    "content.xml": strToU8(`<?xml version="1.0" encoding="UTF-8"?>
<office:document-content xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0" xmlns:table="urn:oasis:names:tc:opendocument:xmlns:table:1.0" xmlns:text="urn:oasis:names:tc:opendocument:xmlns:text:1.0" office:version="1.2">
  <office:body><office:spreadsheet><table:table table:name="Template">${rows}</table:table></office:spreadsheet></office:body>
</office:document-content>`),
    "META-INF/manifest.xml": strToU8(`<?xml version="1.0" encoding="UTF-8"?>
<manifest:manifest xmlns:manifest="urn:oasis:names:tc:opendocument:xmlns:manifest:1.0" manifest:version="1.2">
  <manifest:file-entry manifest:full-path="/" manifest:media-type="application/vnd.oasis.opendocument.spreadsheet"/>
  <manifest:file-entry manifest:full-path="content.xml" manifest:media-type="text/xml"/>
</manifest:manifest>`),
  });
}

export function downloadImportTemplate(type: ImportEntityType, format: SpreadsheetFormat): void {
  const headers = TEMPLATE_COLUMNS[type];
  const example = TEMPLATE_EXAMPLE[type];

  if (format === "csv") {
    downloadBlob(new Blob([toCsv(headers, example)], { type: "text/csv;charset=utf-8" }), `${type}-import-template.csv`);
    return;
  }

  if (format === "xlsx") {
    downloadBlob(new Blob([createXlsx(headers, example).buffer as ArrayBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), `${type}-import-template.xlsx`);
    return;
  }

  downloadBlob(new Blob([createOds(headers, example).buffer as ArrayBuffer], { type: "application/vnd.oasis.opendocument.spreadsheet" }), `${type}-import-template.ods`);
}
