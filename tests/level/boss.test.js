// @vitest-environment jsdom
import { beforeAll, describe, expect, it, vi } from "vitest";
import { RNG } from "rot-js";

vi.mock("../../src/ui/combat.js", () => ({
  init: vi.fn(),
  draw: vi.fn(),
  activate: vi.fn(),
  deactivate: vi.fn(),
}));

import XY from "../../src/util/xy.js";
import { generate } from "../../src/level/generator.js";
import { getLevels } from "../../src/level/decorator.js";
import * as beings from "../../src/being/beings.js";
import * as cells from "../../src/level/cells.js";
import * as rules from "../../src/rules.js";
import * as actors from "../../src/util/actors.js";
import * as keyboard from "../../src/util/keyboard.js";
import * as log from "../../src/ui/log.js";
import * as combat from "../../src/combat/combat.js";
import pc from "../../src/being/pc.js";
import { ATTACK_1 } from "../../src/combat/types.js";

let logNode;
let level;
let bug;
let feature;

function findBug(level) {
  let radius = 12;
  let xy = new XY();
  for (xy.x = -radius; xy.x <= radius; xy.x++) {
    for (xy.y = -radius; xy.y <= radius; xy.y++) {
      let entity = level.getEntity(xy);
      if (entity instanceof beings.TheBug) {
        return entity;
      }
    }
  }
  return null;
}

function fillBoard(value) {
  let board = combat.getBoard();
  let xy = new XY();
  for (xy.x = 0; xy.x < 6; xy.x++) {
    for (xy.y = 0; xy.y < 6; xy.y++) {
      board.set(xy, { value });
    }
  }
}

const tick = () => new Promise((r) => setTimeout(r, 0));

beforeAll(async () => {
  RNG.setSeed(8);
  window.requestAnimationFrame = (fn) => setTimeout(fn, 16);
  logNode = document.createElement("div");
  document.body.appendChild(logNode);
  log.init(logNode);
  combat.init(document.createElement("div"));
  actors.clear();
  Object.keys(getLevels()).forEach((key) => delete getLevels()[key]);

  level = generate(rules.LAST_LEVEL);
  bug = findBug(level);
  feature = level.getCell(level.rooms[0].center.plus(new XY(3, 0)));
  await level.activate(level.start, pc);
});

describe("the top layer", () => {
  it("welcomes the player without ending the game", () => {
    expect(logNode.textContent).toContain("Welcome to the top layer!");
    expect(logNode.textContent).toContain("the Bug");
    expect(logNode.textContent).not.toContain("Congratulations");
    expect(feature.isAwake()).toBe(false);
    expect(feature).toBeInstanceOf(cells.Feature);
    expect(String(feature)).toBe("dormant feature");
  });

  it("puts the Bug in the turn queue, next to the feature", () => {
    expect(bug).not.toBeNull();
    expect(actors.getQueue()).toContain(bug);
    expect(bug.getXY().dist8(level.rooms[0].center.plus(new XY(3, 0)))).toBe(1);
  });

  it("ends the hunt once the Bug is crushed in combat", async () => {
    pc.hp = pc.maxhp;
    pc.inventory.getItems().splice(0);

    // Stand next to the Bug and start debugging it, as the player would.
    pc.moveTo(bug.getXY().minus(new XY(1, 0)));
    let turn = pc.act();
    let fight = combat.start(bug);

    // A full board of the player's blocks: power 36 beats BUG_HP in two.
    fillBoard(ATTACK_1);
    keyboard.dispatch({ key: "Enter" });
    expect(bug.hp).toBeGreaterThan(0);
    expect(feature.isAwake()).toBe(false);

    fillBoard(ATTACK_1);
    keyboard.dispatch({ key: "Enter" });
    await fight;
    pc._resolve();
    await turn;

    expect(bug.hp).toBe(0);
    expect(bug.getXY()).toBeNull();
    expect(logNode.textContent).toContain("You strike at the Bug and crush it!");

    // The outro waits for the combat turn to finish, then takes over.
    await tick();

    expect(feature.isAwake()).toBe(true);
    expect(String(feature)).toBe("restored feature");
    expect(logNode.textContent).toContain("The Bug is crushed!");
    expect(logNode.textContent).toContain("Congratulations");
    expect(logNode.textContent).toContain("Press Escape to continue...");

    // Only Escape gets through until the outro is dismissed.
    let underneath = { handleKeyEvent: vi.fn() };
    keyboard.push(underneath);
    keyboard.pop(); // put it back under the outro's consumer
    keyboard.dispatch({ key: "ArrowLeft" });
    keyboard.dispatch({ key: "Escape" });
    keyboard.push(underneath);
    keyboard.dispatch({ key: "ArrowLeft" });
    expect(underneath.handleKeyEvent).toHaveBeenCalledTimes(1);
    keyboard.pop();
  });

  it("counts the bug reports filed in the outro", () => {
    expect(logNode.textContent).toMatch(/filed a total of \d+ bug reports|free to look around/);
  });
});
