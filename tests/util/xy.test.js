import { describe, expect, it } from "vitest";
import XY from "../../src/util/xy.js";

describe("XY", () => {
  it("defaults to the origin", () => {
    let xy = new XY();
    expect(xy.x).toBe(0);
    expect(xy.y).toBe(0);
  });

  it("round-trips through its string form", () => {
    let xy = new XY(3, -4);
    expect(String(xy)).toBe("3,-4");
    expect(XY.fromString("3,-4").is(xy)).toBe(true);
  });

  it("can be used as an object key", () => {
    let store = {};
    store[new XY(1, 2)] = "here";
    expect(store[new XY(1, 2)]).toBe("here");
    expect(store[new XY(2, 1)]).toBeUndefined();
  });

  it("returns new instances from arithmetic", () => {
    let a = new XY(1, 2);
    let b = a.plus(new XY(10, 20));
    expect(b.is(new XY(11, 22))).toBe(true);
    expect(a.is(new XY(1, 2))).toBe(true);
    expect(a.minus(b).is(new XY(-10, -20))).toBe(true);
    expect(a.scale(2).is(new XY(2, 4))).toBe(true);
    expect(a.scale(2, 3).is(new XY(2, 6))).toBe(true);
  });

  it("computes the three norms", () => {
    let xy = new XY(3, -4);
    expect(xy.norm()).toBe(5);
    expect(xy.norm4()).toBe(7);
    expect(xy.norm8()).toBe(4);
  });

  it("computes distances", () => {
    let a = new XY(0, 0);
    let b = new XY(3, 4);
    expect(a.dist(b)).toBe(5);
    expect(a.dist4(b)).toBe(7);
    expect(a.dist8(b)).toBe(4);
  });

  it("interpolates between points", () => {
    let a = new XY(0, 0);
    let b = new XY(10, 20);
    expect(a.lerp(b, 0).is(a)).toBe(true);
    expect(a.lerp(b, 1).is(b)).toBe(true);
    expect(a.lerp(b, 0.5).is(new XY(5, 10))).toBe(true);
  });

  it("rounds, floors and ceils component-wise", () => {
    let xy = new XY(1.4, -1.6);
    expect(xy.round().is(new XY(1, -2))).toBe(true);
    expect(xy.floor().is(new XY(1, -2))).toBe(true);
    expect(xy.ceil().is(new XY(2, -1))).toBe(true);
  });

  it("wraps negative values with mod", () => {
    let size = new XY(6, 6);
    expect(new XY(-1, 6).mod(size).is(new XY(5, 0))).toBe(true);
    expect(new XY(7, -7).mod(size).is(new XY(1, 5))).toBe(true);
  });

  it("clones to an equal but distinct instance", () => {
    let a = new XY(5, 6);
    let b = a.clone();
    expect(b).not.toBe(a);
    expect(b.is(a)).toBe(true);
  });
});
