import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import XY from "../../src/util/xy.js";
import Animation from "../../src/combat/animation.js";

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

async function flush() {
  for (let i = 0; i < 5; i++) {
    await Promise.resolve();
  }
}

describe("Animation", () => {
  it("marks added cells as animated at their starting position", () => {
    let animation = new Animation();
    let cell = { value: "a1", animated: null };
    animation.add({ cell, from: new XY(0, 3), to: new XY(0, 0) });
    expect(cell.animated.is(new XY(0, 3))).toBe(true);
  });

  it("moves cells towards their target over time and resolves when done", async () => {
    let animation = new Animation();
    let cell = { value: "a1", animated: null };
    animation.add({ cell, from: new XY(2, 4), to: new XY(2, 0) }); // 4 cells

    let draws = 0;
    let done = false;
    animation.start(() => draws++).then(() => (done = true));

    expect(draws).toBe(1); // drawn immediately
    expect(cell.animated.is(new XY(2, 4))).toBe(true);

    vi.advanceTimersByTime(200); // 10 cells/s -> 2 cells
    expect(cell.animated.x).toBe(2);
    expect(cell.animated.y).toBeCloseTo(2, 0);
    expect(done).toBe(false);

    vi.advanceTimersByTime(300);
    await flush();
    expect(done).toBe(true);
    expect(cell.animated).toBeNull();
    expect(draws).toBeGreaterThan(2);
  });

  it("finishes shorter moves before longer ones", async () => {
    let animation = new Animation();
    let near = { value: "a1", animated: null };
    let far = { value: "a1", animated: null };
    animation.add({ cell: near, from: new XY(0, 1), to: new XY(0, 0) });
    animation.add({ cell: far, from: new XY(1, 5), to: new XY(1, 0) });

    animation.start(() => {});
    vi.advanceTimersByTime(150);

    expect(near.animated).toBeNull();
    expect(far.animated).not.toBeNull();
  });

  it("resolves immediately with nothing to animate", async () => {
    let done = false;
    new Animation().start(() => {}).then(() => (done = true));
    await flush();
    expect(done).toBe(true);
  });
});
