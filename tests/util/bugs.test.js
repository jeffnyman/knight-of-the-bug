import { afterEach, describe, expect, it } from "vitest";
import {
  CATALOGUE,
  enable,
  enabledBugs,
  hasBug,
  isKnown,
  reset,
  resolveBugs,
} from "../../src/util/bugs.js";

const ALL = Object.keys(CATALOGUE);

afterEach(() => reset());

describe("seeded bug registry", () => {
  it("has nothing enabled by default", () => {
    expect(enabledBugs()).toEqual([]);
    ALL.forEach((id) => expect(hasBug(id)).toBe(false));
  });

  it("enables bugs by id and lists them in catalogue order", () => {
    enable(["loot-lost", "an-article"]);
    expect(hasBug("an-article")).toBe(true);
    expect(hasBug("loot-lost")).toBe(true);
    expect(hasBug("door-blind")).toBe(false);
    expect(enabledBugs()).toEqual(["an-article", "loot-lost"]);
  });

  it("refuses unknown ids so a typo in the code cannot pass silently", () => {
    expect(isKnown("an-article")).toBe(true);
    expect(isKnown("no-such-bug")).toBe(false);
    expect(() => hasBug("no-such-bug")).toThrow(/unknown seeded bug/);
    expect(() => enable(["no-such-bug"])).toThrow(/unknown seeded bug/);
  });

  it("forgets everything on reset", () => {
    enable(ALL);
    reset();
    expect(enabledBugs()).toEqual([]);
  });
});

describe("resolveBugs", () => {
  it("returns nothing without the parameter", () => {
    expect(resolveBugs("")).toEqual([]);
    expect(resolveBugs("?seed=42")).toEqual([]);
    expect(resolveBugs("?bugs=")).toEqual([]);
  });

  it("selects the named bugs", () => {
    expect(resolveBugs("?bugs=loot-lost")).toEqual(["loot-lost"]);
    expect(resolveBugs("?bugs=loot-lost,an-article")).toEqual(["an-article", "loot-lost"]);
    expect(resolveBugs("?seed=1&bugs=%20door-blind%20,layer-label")).toEqual([
      "door-blind",
      "layer-label",
    ]);
  });

  it("selects everything with all", () => {
    expect(resolveBugs("?bugs=all")).toEqual(ALL);
    expect(resolveBugs("?bugs=loot-lost,all")).toEqual(ALL);
  });

  it("drops unknown ids", () => {
    expect(resolveBugs("?bugs=nope")).toEqual([]);
    expect(resolveBugs("?bugs=nope,loot-lost")).toEqual(["loot-lost"]);
  });
});
