import { beforeEach, describe, expect, it } from "vitest";
import { RNG } from "rot-js";
import XY from "../../src/util/xy.js";
import * as room from "../../src/level/room.js";

beforeEach(() => RNG.setSeed(11));

describe("room", () => {
  it("builds a centred room from a half size", () => {
    let r = room.centerRoom(new XY(4, 3));
    expect(r.center.is(new XY(0, 0))).toBe(true);
    expect(r.lt.is(new XY(-4, -3))).toBe(true);
    expect(r.rb.is(new XY(4, 3))).toBe(true);
    expect(r.neighbors).toEqual([]);
  });

  it("places new rooms near a point with even sizes", () => {
    for (let i = 0; i < 100; i++) {
      let r = room.roomNearTo(new XY(10, 10));
      expect(Math.abs(r.center.x - 10)).toBeLessThanOrEqual(10);
      expect(Math.abs(r.center.y - 10)).toBeLessThanOrEqual(10);

      let size = r.rb.minus(r.lt);
      expect(size.x % 2).toBe(0);
      expect(size.y % 2).toBe(0);
      expect(size.x).toBeGreaterThanOrEqual(4);
      expect(size.x).toBeLessThanOrEqual(10);
      expect(Math.abs(size.y - size.x)).toBeLessThanOrEqual(2);
      expect(r.lt.plus(size.scale(0.5)).is(r.center)).toBe(true);
    }
  });

  it("enlarges a copy without touching the original", () => {
    let r = room.centerRoom(new XY(2, 2));
    let bigger = room.enlarge(r, 2);
    expect(bigger.lt.is(new XY(-4, -4))).toBe(true);
    expect(bigger.rb.is(new XY(4, 4))).toBe(true);
    expect(r.lt.is(new XY(-2, -2))).toBe(true);
    expect(bigger).not.toBe(r);
  });

  it("finds the room furthest away by number of connections", () => {
    let a = room.centerRoom(new XY(1, 1));
    let b = room.centerRoom(new XY(1, 1));
    let c = room.centerRoom(new XY(1, 1));
    let d = room.centerRoom(new XY(1, 1));
    // a - b - c, and a - d
    a.neighbors.push(b, d);
    b.neighbors.push(a, c);
    c.neighbors.push(b);
    d.neighbors.push(a);

    expect(room.furthestRoom([a, b, c, d], a)).toBe(c);
    expect(room.furthestRoom([a, b, c, d], c)).toBe(d);
  });

  it("returns the start room when it has no connections", () => {
    let alone = room.centerRoom(new XY(1, 1));
    expect(room.furthestRoom([alone], alone)).toBe(alone);
  });
});
