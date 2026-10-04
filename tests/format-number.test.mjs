import assert from "node:assert/strict";
import test from "node:test";
import { formatNumber, formatCount, formatDecimal, localizeDecimalText, magnitudeSuffix } from "../app/format-number.ts";

test("large counters remain compact through every finite thousand-group", () => {
  assert.equal(formatNumber(1234), "1,2 k");
  assert.equal(formatNumber(1e9), "1,0 Md");
  assert.equal(formatNumber(1e45), "1,0 QaDc");
  assert.equal(formatNumber(1e48), "1,0 QiDc");
  assert.equal(formatNumber(1e54), "1,0 SpDc");
  assert.equal(formatNumber(1e63), "1,0 Vg");
  assert.equal(formatNumber(1e303), "1,0 Ct");
  assert.equal(formatNumber(Number.MAX_VALUE), "180 UCt");
  const suffixes = new Set();
  for (let group = 1; group <= 102; group++) {
    const label = formatNumber(10 ** (group * 3));
    assert.ok(label.length <= 10, label);
    assert.doesNotMatch(label, /undefined|NaN|∞|e\+/);
    assert.equal(label, `1,0 ${magnitudeSuffix(group)}`);
    suffixes.add(magnitudeSuffix(group));
  }
  assert.equal(suffixes.size, 102);
});

test("rounding carries to the next unit and preserves small and non-finite values", () => {
  assert.equal(formatNumber(999999), "1,0 M");
  assert.equal(formatNumber(0), "0,0");
  assert.equal(formatNumber(24), "24");
  assert.equal(formatNumber(-1e48), "−1,0 QiDc");
  assert.equal(formatNumber(NaN), "0");
  assert.equal(formatNumber(Infinity), "∞");
  assert.equal(formatCount(1), "1");
  assert.equal(formatCount(999), "999");
  assert.equal(formatCount(1e24), "1,0 Sp");
});

test("decimal display uses French commas without changing calculations", () => {
  assert.equal(formatDecimal(2.17, 2), "2,17");
  assert.equal(formatDecimal(0.125, 2), "0,13");
  assert.equal(formatDecimal(-3.5, 1), "-3,5");
  assert.equal(localizeDecimalText("x = 1.25 ; y = -0.5. Fin."), "x = 1,25 ; y = -0,5. Fin.");
});
