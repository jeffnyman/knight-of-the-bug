import { beforeEach, describe, expect, it } from "vitest";
import { RNG } from "rot-js";
import XY from "../../src/util/xy.js";
import { generate } from "../../src/level/generator.js";
import { getLevels } from "../../src/level/decorator.js";
import { dangerToRadius } from "../../src/level/level.js";
import * as cells from "../../src/level/cells.js";
import * as beings from "../../src/being/beings.js";
import * as items from "../../src/item/items.js";
import * as rules from "../../src/rules.js";
import * as actors from "../../src/util/actors.js";
import pc from "../../src/being/pc.js";
import Being from "../../src/being/being.js";
import { BLOCKS_MOVEMENT } from "../../src/entity.js";
import { DIRS } from "../../src/conf.js";

beforeEach(() => {
  RNG.setSeed(2017);
  actors.clear();
  Object.keys(getLevels()).forEach((key) => delete getLevels()[key]);
});

// Every position within the floor's bounding box, for scanning.
function scan(level, visit) {
  let radius = dangerToRadius(level.danger);
  let xy = new XY();
  for (xy.x = -radius - 1; xy.x <= radius + 1; xy.x++) {
    for (xy.y = -radius - 1; xy.y <= radius + 1; xy.y++) {
      visit(xy.clone());
    }
  }
}

function findAll(level, predicate) {
  let found = [];
  scan(level, (xy) => {
    if (predicate(level.getEntity(xy), xy)) {
      found.push(xy);
    }
  });
  return found;
}

function allRoomsConnected(level) {
  let seen = new Set([level.rooms[0]]);
  let queue = [level.rooms[0]];
  while (queue.length) {
    let r = queue.shift();
    r.neighbors.forEach((n) => {
      if (!seen.has(n)) {
        seen.add(n);
        queue.push(n);
      }
    });
  }
  return seen.size == level.rooms.length;
}

// Whether the player could step onto the cell, opening doors as needed.
function passable(level, xy) {
  let cell = level.getCell(xy);
  if (cell == cells.WALL) {
    return false;
  }
  if (cell instanceof cells.Door) {
    return true;
  }
  return cell.blocks < BLOCKS_MOVEMENT;
}

// Every cell the player could walk to from the given one.
function reachableFrom(level, from) {
  let seen = new Set([from.toString()]);
  let queue = [from];
  while (queue.length) {
    let xy = queue.shift();
    DIRS.forEach((d) => {
      let next = xy.plus(d);
      if (seen.has(next.toString()) || !passable(level, next)) {
        return;
      }
      seen.add(next.toString());
      queue.push(next);
    });
  }
  return seen;
}

describe("generate", () => {
  it("builds a connected floor of several rooms within the ellipse", () => {
    let level = generate(1);

    expect(level.rooms.length).toBeGreaterThan(2);
    expect(allRoomsConnected(level)).toBe(true);

    let carved = findAll(level, (e) => e != cells.WALL);
    expect(carved.length).toBeGreaterThan(50);
    carved.forEach((xy) => expect(level.isInside(xy)).toBe(true));
  });

  // The neighbour graph says which rooms were joined, not whether the
  // corridor survived trimming at the floor's edge. Walk the actual cells
  // from the arrival point and insist that every room, and above all the
  // staircase up, can be reached on foot. Many seeds and every regular
  // floor size are tried because the failure used to be a rare one.
  it("keeps every room and the staircase up reachable on foot", () => {
    for (let seed = 1; seed <= 40; seed++) {
      for (let danger = 1; danger < rules.LAST_LEVEL; danger++) {
        Object.keys(getLevels()).forEach((key) => delete getLevels()[key]);
        RNG.setSeed(seed * 1000 + danger);
        let level = generate(danger);

        let seen = reachableFrom(level, level.start);
        let stranded = level.rooms.filter((r) => !seen.has(r.center.toString()));

        expect(stranded, `seed ${seed * 1000 + danger}`).toHaveLength(0);
        expect(seen.has(level.end.toString()), `seed ${seed * 1000 + danger}`).toBe(true);
      }
    }
  });

  it("puts the start and end in different rooms, with a staircase up at the end", () => {
    let level = generate(1);

    expect(level.start.is(level.end)).toBe(false);
    // Room centres are where corridors begin, so the start may be either.
    expect(level.getCell(level.start)).toBeInstanceOf(cells.Floor);

    let up = level.getCell(level.end);
    expect(up).toBeInstanceOf(cells.Staircase);
    expect(up.getVisual().ch).toBe("<");
  });

  it("introduces the first floor gently", () => {
    let level = generate(1);

    let rats = findAll(level, (e) => e instanceof beings.Typo);
    let hostiles = findAll(level, (e) => e instanceof Being && e.ai?.hostile);
    let potions = findAll(level, (e) => e instanceof items.Coffee);
    let daggers = findAll(level, (e) => e instanceof items.PrintStatement);

    let spareRooms = Math.min(3, level.rooms.length - 2);
    expect(rats.length + potions.length + daggers.length).toBe(spareRooms);
    expect(hostiles).toHaveLength(0);

    let doorsClosed = findAll(level, (e) => e instanceof cells.Door && !e.isOpen());
    expect(doorsClosed.length).toBeGreaterThan(0);
  });

  it("fills later floors with brambles, loot and monsters", () => {
    generate(1);
    let level = generate(2);

    expect(level.getCell(level.start)).toBeInstanceOf(cells.Staircase);
    expect(level.getCell(level.start).getVisual().ch).toBe(">");

    let brambles = findAll(level, (e) => e == cells.TANGLED_CODE);
    let monsters = findAll(level, (e) => e instanceof Being && e.constructor.danger);
    expect(brambles.length).toBeGreaterThan(0);
    expect(monsters.length).toBeGreaterThan(0);
  });

  it("builds the top layer as one hall with the feature and the Bug in it", () => {
    let level = generate(rules.LAST_LEVEL);

    expect(level.rooms).toHaveLength(1);
    let bed = level.rooms[0].center.plus(new XY(3, 0));
    expect(level.getCell(bed)).toBeInstanceOf(cells.Feature);

    [new XY(-1, -1), new XY(1, -1), new XY(-1, 1), new XY(1, 1)].forEach((d) => {
      expect(level.getCell(bed.plus(d))).toBeInstanceOf(cells.Pillar);
    });

    let bug = level.getEntity(bed.plus(new XY(-1, 0)));
    expect(bug).toBeInstanceOf(beings.TheBug);
    expect(bug.ai.mobile).toBe(false);
    expect(bug.ai.hostile).toBe(true);

    let guards = [new XY(0, -1), new XY(0, 1), new XY(1, 0)].map((d) =>
      level.getEntity(bed.plus(d)),
    );
    guards.forEach((guard) => {
      expect(guard).toBeInstanceOf(beings.Colleague);
      expect(guard.ai.mobile).toBe(false);
    });

    expect(level.getCell(level.start)).toBe(cells.ROOM);
    expect(level.end).toBeNull();
  });

  it("is reproducible for a given seed", () => {
    let snapshot = (level) => {
      let chars = [];
      scan(level, (xy) => chars.push(level.getEntity(xy).getVisual().ch));
      return chars.join("");
    };

    RNG.setSeed(42);
    let first = snapshot(generate(3));
    Object.keys(getLevels()).forEach((key) => delete getLevels()[key]);
    RNG.setSeed(42);
    let second = snapshot(generate(3));

    expect(first).toBe(second);
  });

  it("links floors through their staircases", async () => {
    let first = generate(1);
    await first.activate(first.start, pc);
    let maxhp = pc.maxhp;

    await first.getCell(first.end).activate(pc);

    let second = pc.getLevel();
    expect(second.danger).toBe(2);
    expect(second).toBe(getLevels()[2]);
    expect(pc.getXY().is(second.start)).toBe(true);
    expect(pc.maxhp).toBe(maxhp + rules.LEVEL_HP);

    await second.getCell(second.start).activate(pc);

    expect(pc.getLevel()).toBe(first);
    expect(pc.getXY().is(first.end)).toBe(true);
  });
});
