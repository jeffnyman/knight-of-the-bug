import { beforeEach, describe, expect, it, vi } from "vitest";
import { RNG } from "rot-js";
import XY from "../../src/util/xy.js";
import Level, { dangerToRadius } from "../../src/level/level.js";
import * as cells from "../../src/level/cells.js";
import * as actors from "../../src/util/actors.js";
import * as pubsub from "../../src/util/pubsub.js";
import * as rules from "../../src/rules.js";
import Being from "../../src/being/being.js";
import pc from "../../src/being/pc.js";
import { BugReport } from "../../src/item/items.js";
import { centerRoom } from "../../src/level/room.js";

beforeEach(() => {
  RNG.setSeed(3);
  actors.clear();
});

function squareLevel(half = 5) {
  let level = new Level(1);
  level.carveRoom(centerRoom(new XY(half, half)));
  return level;
}

describe("dangerToRadius", () => {
  it("is small for the first floor, large for the second, and shrinks after that", () => {
    expect(dangerToRadius(1)).toBe(15);
    expect(dangerToRadius(2)).toBe(30);
    expect(dangerToRadius(rules.LAST_LEVEL - 1)).toBe(20);
    expect(dangerToRadius(rules.LAST_LEVEL)).toBe(10);

    for (let d = 2; d < rules.LAST_LEVEL - 1; d++) {
      expect(dangerToRadius(d + 1)).toBeLessThanOrEqual(dangerToRadius(d));
    }
  });
});

describe("Level", () => {
  it("is solid wall until something is carved", () => {
    let level = new Level(1);
    expect(level.getEntity(new XY(0, 0))).toBe(cells.WALL);
    expect(level.getCell(new XY(0, 0))).toBe(cells.WALL);
    expect(level.getItem(new XY(0, 0))).toBeUndefined();
  });

  it("is an ellipse wider than it is tall", () => {
    let level = new Level(1); // radius 15
    expect(level.isInside(new XY(14, 0))).toBe(true);
    expect(level.isInside(new XY(15, 0))).toBe(false);
    expect(level.isInside(new XY(0, 9))).toBe(true);
    expect(level.isInside(new XY(0, 10))).toBe(false);

    expect(level.isOutside(new XY(17, 0))).toBe(false);
    expect(level.isOutside(new XY(18, 0))).toBe(true);
  });

  it("carves rooms and records them", () => {
    let level = squareLevel(2);
    expect(level.rooms).toHaveLength(1);
    expect(level.getCell(new XY(0, 0))).toBe(cells.ROOM);
    expect(level.getCell(new XY(-2, 2))).toBe(cells.ROOM);
    expect(level.getCell(new XY(3, 0))).toBe(cells.WALL);
  });

  it("carves straight and diagonal corridors between two points", () => {
    let level = new Level(1);
    level.carveCorridor(new XY(0, 0), new XY(4, 0));
    for (let x = 0; x <= 4; x++) {
      expect(level.getCell(new XY(x, 0))).toBe(cells.CORRIDOR);
    }
    expect(level.getCell(new XY(5, 0))).toBe(cells.WALL);

    level.carveCorridor(new XY(0, 0), new XY(0, -3));
    expect(level.getCell(new XY(0, -3))).toBe(cells.CORRIDOR);
  });

  it("knows whether a room would overlap anything carved", () => {
    let level = squareLevel(2);
    expect(level.fits(centerRoom(new XY(1, 1)))).toBe(false);
    let farRoom = centerRoom(new XY(1, 1));
    farRoom.lt = new XY(5, 5);
    farRoom.rb = new XY(7, 7);
    expect(level.fits(farRoom)).toBe(true);
  });

  it("trims carved cells that fall outside the ellipse", () => {
    let level = new Level(1);
    level.carveCorridor(new XY(0, 0), new XY(20, 0));
    level.trim();
    expect(level.getCell(new XY(10, 0))).toBe(cells.CORRIDOR);
    expect(level.getCell(new XY(16, 0))).toBe(cells.WALL);
  });

  it("layers beings over items over cells", () => {
    let level = squareLevel();
    let xy = new XY(1, 1);
    expect(level.getEntity(xy)).toBe(cells.ROOM);

    let coin = new BugReport();
    level.setItem(xy, coin);
    expect(level.getEntity(xy)).toBe(coin);

    let rat = new Being({ ch: "r", fg: "#aaa", name: "rat" });
    rat.moveTo(xy, level);
    expect(level.getEntity(xy)).toBe(rat);

    rat.moveTo(null);
    expect(level.getEntity(xy)).toBe(coin);
  });

  it("announces visual changes when beings or items are set", () => {
    let listener = vi.fn();
    pubsub.subscribe("visual-change", listener);
    let level = squareLevel();
    let xy = new XY(2, 2);

    level.setItem(xy, new BugReport());
    expect(listener).toHaveBeenCalledWith("visual-change", level, { xy });
    pubsub.unsubscribe("visual-change", listener);
  });

  it("turns corridor cells on a room's outline into doors", () => {
    let level = squareLevel(2);
    level.carveCorridor(new XY(3, 0), new XY(6, 0)); // leaves the room eastwards
    level.carveCorridor(new XY(0, -3), new XY(0, -6)); // and northwards
    level.carveCorridor(new XY(3, 3), new XY(6, 6)); // touches only the corner

    level.carveDoors(level.rooms[0], { doorChance: 1, closedChance: 1 });

    expect(level.getCell(new XY(3, 0))).toBeInstanceOf(cells.Door);
    expect(level.getCell(new XY(3, 0)).isOpen()).toBe(false);
    expect(level.getCell(new XY(0, -3))).toBeInstanceOf(cells.Door);
    expect(level.getCell(new XY(4, 0))).toBe(cells.CORRIDOR);
    expect(level.getCell(new XY(3, 3))).toBe(cells.CORRIDOR); // corners never get doors
  });

  it("never places doors when the chance is zero", () => {
    let level = squareLevel(2);
    level.carveCorridor(new XY(3, 0), new XY(6, 0));
    level.carveDoors(level.rooms[0], { doorChance: 0 });
    expect(level.getCell(new XY(3, 0))).toBe(cells.CORRIDOR);
  });

  it("activates by placing the player and queueing every being", async () => {
    let level = squareLevel();
    let rat = new Being({ ch: "r", fg: "#aaa", name: "rat" });
    rat.moveTo(new XY(3, 3), level);

    await level.activate(new XY(0, 0), pc);

    expect(pc.getLevel()).toBe(level);
    expect(pc.getXY().is(new XY(0, 0))).toBe(true);
    expect(level.getEntity(new XY(0, 0))).toBe(pc);
    expect(actors.getQueue()).toEqual([rat, pc]);
  });

  it("leaves beings out of the queue once they have gone", async () => {
    let level = squareLevel();
    let rat = new Being({ ch: "r", fg: "#aaa", name: "rat" });
    rat.moveTo(new XY(3, 3), level);
    rat.moveTo(null);

    await level.activate(new XY(0, 0), pc);

    expect(actors.getQueue()).toEqual([pc]);
  });
});

describe("door placement (upstream issue #3)", () => {
  it("never puts two doors right next to each other", () => {
    let level = squareLevel(2);
    // A corridor running the whole length of the room's east outline.
    level.carveCorridor(new XY(3, -2), new XY(3, 2));

    level.carveDoors(level.rooms[0], { doorChance: 1 });

    let doors = [];
    for (let y = -2; y <= 2; y++) {
      if (level.getCell(new XY(3, y)) instanceof cells.Door) {
        doors.push(y);
      }
    }
    expect(doors.length).toBeGreaterThan(0);
    for (let i = 1; i < doors.length; i++) {
      expect(doors[i] - doors[i - 1]).toBeGreaterThan(1);
    }
  });

  it("still allows doors on different sides of a corner", () => {
    let level = squareLevel(2);
    level.carveCorridor(new XY(3, 0), new XY(6, 0));
    level.carveCorridor(new XY(0, 3), new XY(0, 6));

    level.carveDoors(level.rooms[0], { doorChance: 1 });

    expect(level.getCell(new XY(3, 0))).toBeInstanceOf(cells.Door);
    expect(level.getCell(new XY(0, 3))).toBeInstanceOf(cells.Door);
  });
});
