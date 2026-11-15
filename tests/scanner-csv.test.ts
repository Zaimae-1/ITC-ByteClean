import assert from "node:assert/strict";
import test from "node:test";
import { filesToCsv } from "../lib/scanner/csv";

test("CSV quotes values and neutralizes spreadsheet formulas", () => {
  const csv = filesToCsv([{
    id: "1",
    name: "=HYPERLINK(\"bad\")",
    path: "Folder/=HYPERLINK(\"bad\")",
    size: 10,
    lastModified: Date.UTC(2026, 0, 1),
    categories: ["temporary"],
  }]);
  assert.match(csv, /"'=HYPERLINK\(""bad""\)"/);
  assert.match(csv, /"Folder\/=HYPERLINK\(""bad""\)"/);
});
