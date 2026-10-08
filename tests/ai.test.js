import { beforeEach, describe, expect, it, vi } from "vitest";
import { RNG } from "rot-js";

vi.mock("../src/combat/combat.js", () => ({
  init: vi.fn(),
  start: vi.fn(() => Promise.resolve()),
}));

import * as combat from "../src/combat/combat.js";
import * as ai from "../src/ai.js";
import * as cells from "../src/level/cells.js";
import * as rules from "../src/rules.js";
import XY from "../src/util/xy.js";
import pc from "../src/being/pc.js";
import { Typo } from "../src/being/beings.js";
import FakeLevel from "./helpers/fake-level.js";

// An open floor from -HALF to HALF in both axes, player at the origin.
const HALF = 15;

function openLevel() {
  let level = new FakeLevel();
  for (let x = -HALF; x <= HALF; x++) {
    for (let y = -HALF; y <= HALF; y++) {
      level.setCell(new XY(x, y), cells.ROOM);
    }
  }
  pc.moveTo(new XY(0, 0), level);
  return level;
}

function typoAt(level, x, y, hostile) {
  let typo = new Typo();
  typo.ai.hostile = hostile;
  typo.moveTo(new XY(x, y), level);
  return typo;
}

beforeEach(() => {
  RNG.setSeed(8);
  combat.start.mockClear();
});

describe("hostile beings", () => {
  it("attack the player when adjacent", async () => {
    let level = openLevel();
    let typo = typoAt(level, 1, 0, true);

    await ai.act(typo);

    expect(combat.start).toHaveBeenCalledWith(typo);
    expect(typo.getXY().is(new XY(1, 0))).toBe(true);
  });

  it("close in on the player when within range", async () => {
    let level = openLevel();
    let typo = typoAt(level, rules.AI_RANGE, 0, true);

    await ai.act(typo);

    expect(combat.start).not.toHaveBeenCalled();
    expect(typo.getXY().dist8(pc.getXY())).toBe(rules.AI_RANGE - 1);
  });

  it("step around obstacles rather than into them", async () => {
    let level = openLevel();
    let typo = typoAt(level, 3, 0, true);
    level.setCell(new XY(2, 0), cells.WALL);

    await ai.act(typo);

    expect(typo.getXY().dist8(pc.getXY())).toBe(2);
    expect(typo.getXY().x).toBe(2);
    expect(Math.abs(typo.getXY().y)).toBe(1);
  });

  it("only wander when the player is out of range", async () => {
    let level = openLevel();
    let start = new XY(rules.AI_RANGE + 3, 0);
    let typo = typoAt(level, start.x, start.y, true);

    for (let i = 0; i < 20; i++) {
      let before = typo.getXY();
      await ai.act(typo);
      expect(typo.getXY().dist8(before)).toBeLessThanOrEqual(1);
    }

    expect(combat.start).not.toHaveBeenCalled();
  });

  it("stay put when rooted, unless the player comes adjacent", async () => {
    let level = openLevel();
    let tree = typoAt(level, 4, 0, true);
    tree.ai.mobile = false;

    await ai.act(tree);
    expect(tree.getXY().is(new XY(4, 0))).toBe(true);

    pc.moveTo(new XY(3, 0));
    await ai.act(tree);
    expect(combat.start).toHaveBeenCalledWith(tree);
  });
});

describe("peaceful beings", () => {
  it("wander about and never attack", async () => {
    let level = openLevel();
    let typo = typoAt(level, 1, 0, false);
    let positions = new Set();

    for (let i = 0; i < 40; i++) {
      let before = typo.getXY();
      await ai.act(typo);
      expect(typo.getXY().dist8(before)).toBeLessThanOrEqual(1);
      positions.add(String(typo.getXY()));
    }

    expect(positions.size).toBeGreaterThan(1);
    expect(combat.start).not.toHaveBeenCalled();
  });

  it("never walk into the player or walls", async () => {
    let level = openLevel();
    let typo = typoAt(level, 1, 0, false);
    // Box the typo in: player to the west, walls everywhere else.
    [
      [2, -1], [2, 0], [2, 1],
      [1, -1], [1, 1],
      [0, -1], [0, 1],
    ].forEach(([x, y]) => level.setCell(new XY(x, y), cells.WALL));

    for (let i = 0; i < 20; i++) {
      await ai.act(typo);
      expect(typo.getXY().is(new XY(1, 0))).toBe(true);
    }
  });

  it("stay put when rooted", async () => {
    let level = openLevel();
    let typo = typoAt(level, 3, 3, false);
    typo.ai.mobile = false;

    for (let i = 0; i < 10; i++) {
      await ai.act(typo);
    }

    expect(typo.getXY().is(new XY(3, 3))).toBe(true);
  });
});
