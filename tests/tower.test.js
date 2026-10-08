// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { RNG } from "rot-js";
import {
  buildMiddleRow,
  buildTowerRows,
} from "../src/screens/splash/tower.js";

describe("tower", () => {
  it("builds middle rows of a constant width with bracketed edges", () => {
    RNG.setSeed(42);

    for (let i = 0; i < 50; i++) {
      let row = buildMiddleRow();
      expect(row).toHaveLength(21);
      expect(row.startsWith("   [")).toBe(true);
      expect(row.endsWith("]   ")).toBe(true);
    }
  });

  it("only uses brick, separator, vine and flower characters", () => {
    RNG.setSeed(7);
    let interior = buildMiddleRow().slice(4, -4);
    expect(interior).toMatch(/^[_I\][#*]+$/);
  });

  it("stacks the fixed top, the requested middle rows and the fixed bottom", () => {
    let rows = buildTowerRows(5);
    expect(rows).toHaveLength(9 + 5 + 1);
    expect(rows[0]).toBe(" _     _     _     _ ");
    expect(rows.at(-1)).toBe(" \\\\[__]#_I__][__#]// ");
  });

  it("is reproducible for a given seed", () => {
    RNG.setSeed(1234);
    let first = buildTowerRows(8);
    RNG.setSeed(1234);
    let second = buildTowerRows(8);
    expect(first).toEqual(second);
  });
});
