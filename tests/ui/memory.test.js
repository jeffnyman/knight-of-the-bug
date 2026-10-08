import { beforeEach, describe, expect, it } from "vitest";
import XY from "../../src/util/xy.js";
import Level from "../../src/level/level.js";
import Memory from "../../src/ui/map/memory.js";
import * as cells from "../../src/level/cells.js";
import * as actors from "../../src/util/actors.js";
import pc from "../../src/being/pc.js";
import { BugReport } from "../../src/item/items.js";
import { centerRoom } from "../../src/level/room.js";

let level;
let memory;
let nextId = 100;

beforeEach(async () => {
  actors.clear();
  level = new Level(1);
  level.id = nextId++; // keep each test's memory separate
  level.carveRoom(centerRoom(new XY(5, 5)));
  await level.activate(new XY(0, 0), pc);
  memory = Memory.forLevel(level);
});

describe("Memory", () => {
  it("is shared per level", () => {
    expect(Memory.forLevel(level)).toBe(memory);
  });

  it("shows what is in view, topmost thing first", () => {
    expect(memory.visualAt(new XY(0, 0)).ch).toBe("@");
    expect(memory.visualAt(new XY(3, 3))).toBe(cells.ROOM.getVisual());

    let coin = new BugReport();
    level.setItem(new XY(2, 0), coin);
    expect(memory.visualAt(new XY(2, 0))).toBe(coin.getVisual());
  });

  it("shows the walls that bound the view", () => {
    expect(memory.visualAt(new XY(6, 0))).toBe(cells.WALL.getVisual());
  });

  it("shows nothing for places never seen", () => {
    expect(memory.visualAt(new XY(12, 0))).toBeNull();
    expect(memory.visualAt(new XY(-12, 3))).toBeNull();
  });

  it("remembers cells after they leave the view, dimmed and without their contents", () => {
    let far = new XY(5, 5);
    level.setItem(far, new BugReport());
    expect(memory.visualAt(far).ch).toBe("$");

    pc.moveTo(new XY(-5, -5));
    expect(far in pc.fov).toBe(false);

    let remembered = memory.visualAt(far);
    expect(remembered.ch).toBe(".");
    expect(remembered.fg).toBe("rgb(85,85,85)");
  });

  it("paints grass and trees outside the tower", () => {
    let seen = new Set();
    for (let x = 20; x < 80; x++) {
      for (let y = 0; y < 20; y += 5) {
        seen.add(memory.visualAt(new XY(x, y)).ch);
      }
    }
    expect(seen.has("\"") || seen.has("'")).toBe(true);
    seen.forEach((ch) => expect(["\"", "'", "T"]).toContain(ch));
  });

  it("paints the same scenery every time", () => {
    let xy = new XY(33, 7);
    expect(memory.visualAt(xy)).toBe(memory.visualAt(xy));
  });
});
