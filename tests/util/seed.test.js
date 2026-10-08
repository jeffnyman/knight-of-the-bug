import { describe, expect, it } from "vitest";
import { resolveSeed, seedQuery } from "../../src/util/seed.js";

describe("resolveSeed", () => {
  it("reads an integer seed from the query string", () => {
    expect(resolveSeed("?seed=42", 1)).toBe(42);
    expect(resolveSeed("?seed=-7", 1)).toBe(-7);
    expect(resolveSeed("?seed=1791370004974", 1)).toBe(1791370004974);
  });

  it("finds the seed among other parameters", () => {
    expect(resolveSeed("?debug=1&seed=42&x=y", 1)).toBe(42);
  });

  it("falls back when there is no seed", () => {
    expect(resolveSeed("", 1)).toBe(1);
    expect(resolveSeed("?", 1)).toBe(1);
    expect(resolveSeed("?other=42", 1)).toBe(1);
  });

  it("falls back on anything that is not a plain integer", () => {
    expect(resolveSeed("?seed=", 1)).toBe(1);
    expect(resolveSeed("?seed=abc", 1)).toBe(1);
    expect(resolveSeed("?seed=4.2", 1)).toBe(1);
    expect(resolveSeed("?seed=1e3", 1)).toBe(1);
    expect(resolveSeed("?seed=0x10", 1)).toBe(1);
    expect(resolveSeed("?seed=99999999999999999999", 1)).toBe(1);
  });

  it("tolerates surrounding whitespace", () => {
    expect(resolveSeed("?seed=%2042%20", 1)).toBe(42);
  });

  it("uses the clock when no fallback is given", () => {
    let before = Date.now();
    let seed = resolveSeed("");
    expect(seed).toBeGreaterThanOrEqual(before);
    expect(seed).toBeLessThanOrEqual(Date.now());
  });
});

describe("seedQuery", () => {
  it("builds the query string that replays a seed", () => {
    expect(seedQuery(42)).toBe("?seed=42");
    expect(resolveSeed(seedQuery(-123), 1)).toBe(-123);
  });
});
