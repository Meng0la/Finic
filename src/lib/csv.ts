function escapeCsvField(value: string): string {
  if (/[",\n;]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function toCsv(headers: string[], rows: (string | number | null)[][]): string {
  const lines = [headers.map(escapeCsvField).join(";")];
  for (const row of rows) {
    lines.push(row.map((cell) => escapeCsvField(cell === null ? "" : String(cell))).join(";"));
  }
  // BOM pra Excel abrir acentuação em UTF-8 corretamente.
  return "﻿" + lines.join("\r\n");
}

function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (inQuotes) {
      if (char === '"') {
        if (line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ";") {
      fields.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  fields.push(current);
  return fields;
}

export function fromCsv(text: string): string[][] {
  const clean = text.replace(/^﻿/, "");
  const lines = clean.split(/\r\n|\n/).filter((line) => line.trim().length > 0);
  return lines.map(parseCsvLine);
}
