// @vitest-environment jsdom
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { RNG } from "rot-js";

vi.mock("../../src/ui/combat.js", () => ({
  init: vi.fn(),
  draw: vi.fn(),
  activate: vi.fn(),
  deactivate: vi.fn(),
}));

import * as ui from "../../src/ui/combat.js";
import * as combat from "../../src/combat/combat.js";
import * as keyboard from "../../src/util/keyboard.js";
import * as actors from "../../src/util/actors.js";
import * as log from "../../src/ui/log.js";
import pc from "../../src/being/pc.js";
import Level from "../../src/level/level.js";
import XY from "../../src/util/xy.js";
import { Typo, OffByOne } from "../../src/being/beings.js";
import { ATTACK_1, ATTACK_2, MAGIC_1, MAGIC_2 } from "../../src/combat/types.js";
import { centerRoom } from "../../src/level/room.js";

let logNode;
let level;

function fillBoard(value) {
  let board = combat.getBoard();
  let xy = new XY();
  for (xy.x = 0; xy.x < 6; xy.x++) {
    for (xy.y = 0; xy.y < 6; xy.y++) {
      board.set(xy, { value });
    }
  }
}

// Two-by-two of `value` in the bottom-left corner, everything else a
// checkerboard of the other kinds so nothing else matches.
function cornerBoard(value) {
  let board = combat.getBoard();
  let others = [ATTACK_1, ATTACK_2, MAGIC_1, MAGIC_2].filter((v) => v != value);
  let xy = new XY();
  for (xy.x = 0; xy.x < 6; xy.x++) {
    for (xy.y = 0; xy.y < 6; xy.y++) {
      board.set(xy, { value: others[(xy.x + 2 * xy.y) % 3] });
    }
  }
  [new XY(0, 0), new XY(1, 0), new XY(0, 1), new XY(1, 1)].forEach((c) =>
    board.set(c, { value }),
  );
}

function press(key) {
  keyboard.dispatch({ key });
}

async function flush() {
  for (let i = 0; i < 10; i++) {
    await Promise.resolve();
  }
}

async function monster(Ctor, hp) {
  let m = new Ctor();
  m.ai.hostile = true;
  m.hp = m.maxhp = hp;
  m.moveTo(new XY(1, 0), level);
  actors.add(m);
  return m;
}

beforeAll(async () => {
  window.requestAnimationFrame = (fn) => setTimeout(fn, 16);
  logNode = document.createElement("div");
  document.body.appendChild(logNode);
  log.init(logNode);
  combat.init(document.createElement("div"));

  level = new Level(1);
  level.carveRoom(centerRoom(new XY(5, 5)));
  await level.activate(new XY(0, 0), pc);
});

beforeEach(() => {
  RNG.setSeed(4);
  vi.useFakeTimers();
  actors.clear();
  pc.inventory.getItems().splice(0);
  pc.hp = pc.maxhp;
  pc.mana = pc.maxmana;
  logNode.replaceChildren();
  log.pause();
  ui.draw.mockClear();
});

afterEach(() => vi.useRealTimers());

describe("combat", () => {
  it("starts with a board that has something to play", () => {
    let segments = combat.getBoard().getAllSegments();
    expect(segments[0].length).toBeGreaterThanOrEqual(2);
    expect(segments.flat()).toHaveLength(36);
  });

  it("explains itself the first time, takes the keyboard and dims the map", async () => {
    let rat = await monster(Typo, 1);
    let fight = combat.start(rat);

    expect(logNode.textContent).toContain("Debug Session");
    expect(ui.activate).toHaveBeenCalled();

    // The keyboard now belongs to the fight: arrows move the cursor, not the player.
    press("ArrowRight");
    expect(pc.getXY().is(new XY(0, 0))).toBe(true);
    expect(ui.draw).toHaveBeenCalled();

    fillBoard(ATTACK_1);
    press("Enter");
    await fight;
    expect(logNode.textContent).toContain("You strike at the typo and crush it!");
  });

  it("moves the cursor with wrap-around, up being up", () => {
    combat.start(new Typo());
    let start = combat.getCursor();

    press("ArrowUp");
    expect(combat.getCursor().y).toBe((start.y + 1) % 6);
    press("ArrowDown");
    expect(combat.getCursor().is(start)).toBe(true);

    for (let i = 0; i < 6; i++) {
      press("ArrowLeft");
    }
    expect(combat.getCursor().is(start)).toBe(true);
    keyboard.pop();
  });

  it("ignores Enter on a single block", async () => {
    let goblin = await monster(OffByOne, 10);
    combat.start(goblin);
    cornerBoard(ATTACK_1);
    while (!combat.getCursor().is(new XY(5, 5))) {
      press(combat.getCursor().x < 5 ? "ArrowRight" : "ArrowUp");
    }

    press("Enter");

    expect(goblin.hp).toBe(10);
    expect(logNode.textContent).not.toContain("hit");
    keyboard.pop();
  });

  it("hurts the enemy by attack plus power minus defense when the player's blocks match", async () => {
    let goblin = await monster(OffByOne, 30);
    goblin.maxhp = 30;
    combat.start(goblin);
    cornerBoard(ATTACK_1); // a group of 4
    while (!combat.getCursor().is(new XY(0, 0))) {
      press(combat.getCursor().x > 0 ? "ArrowLeft" : "ArrowDown");
    }

    press("Enter");

    // attack 10 + power 4 - defense 10 = 4
    expect(goblin.hp).toBe(26);
    expect(logNode.textContent).toContain("You strike at the off-by-one error and slightly weaken it.");
    keyboard.pop();
  });

  it("lets the enemy hit back when its blocks match", async () => {
    let goblin = await monster(OffByOne, 30);
    combat.start(goblin);
    cornerBoard(ATTACK_2);
    while (!combat.getCursor().is(new XY(0, 0))) {
      press(combat.getCursor().x > 0 ? "ArrowLeft" : "ArrowDown");
    }

    press("Enter");

    expect(pc.hp).toBe(pc.maxhp - 4);
    expect(logNode.textContent).toContain("The off-by-one error strikes at you and slightly weakens you.");
    keyboard.pop();
  });

  it("spends mana on magic and refuses without enough", async () => {
    let goblin = await monster(OffByOne, 30);
    combat.start(goblin);
    cornerBoard(MAGIC_1);
    while (!combat.getCursor().is(new XY(0, 0))) {
      press(combat.getCursor().x > 0 ? "ArrowLeft" : "ArrowDown");
    }

    press("Enter");
    expect(pc.mana).toBe(pc.maxmana - 4);
    expect(goblin.hp).toBe(26);
    expect(logNode.textContent).toContain("You cast a hotfix at the off-by-one error");

    cornerBoard(MAGIC_2); // the goblin has 5 mana: a 4-group it can afford
    press("Enter");
    expect(goblin.mana).toBe(1);
    expect(pc.hp).toBe(pc.maxhp - 4);

    cornerBoard(MAGIC_2);
    press("Enter");
    expect(pc.hp).toBe(pc.maxhp - 4);
    expect(logNode.textContent).toContain("The off-by-one error does not have enough focus to attack.");
    keyboard.pop();
  });

  it("always does at least one point of damage", async () => {
    let goblin = await monster(OffByOne, 30);
    goblin.defense = 100;
    combat.start(goblin);
    cornerBoard(ATTACK_1);
    while (!combat.getCursor().is(new XY(0, 0))) {
      press(combat.getCursor().x > 0 ? "ArrowLeft" : "ArrowDown");
    }

    press("Enter");

    expect(goblin.hp).toBe(29);
    keyboard.pop();
  });

  it("refills the board after a play, with something left to play", async () => {
    let goblin = await monster(OffByOne, 30);
    combat.start(goblin);
    cornerBoard(ATTACK_1);
    while (!combat.getCursor().is(new XY(0, 0))) {
      press(combat.getCursor().x > 0 ? "ArrowLeft" : "ArrowDown");
    }

    press("Enter");
    vi.advanceTimersByTime(2000);
    await flush();

    let board = combat.getBoard();
    let xy = new XY();
    for (xy.x = 0; xy.x < 6; xy.x++) {
      for (xy.y = 0; xy.y < 6; xy.y++) {
        expect(board.at(xy)).not.toBeNull();
        expect(board.at(xy).animated).toBeFalsy();
      }
    }
    expect(board.getAllSegments()[0].length).toBeGreaterThanOrEqual(2);
    keyboard.pop();
  });

  it("ends when the enemy dies, removing it from the level", async () => {
    let rat = await monster(Typo, 1);
    let fight = combat.start(rat);
    fillBoard(ATTACK_1);

    press("Enter");
    await fight;

    expect(rat.getXY()).toBeNull();
    expect(actors.getQueue()).not.toContain(rat);
    expect(ui.deactivate).toHaveBeenCalled();

    // The keyboard is handed back.
    let received = null;
    keyboard.push({ handleKeyEvent: (e) => (received = e) });
    press("z");
    expect(received).toEqual({ key: "z" });
    keyboard.pop();
  });

  it("ends with the game over when the player dies", async () => {
    let goblin = await monster(OffByOne, 30);
    pc.hp = 1;
    let fight = combat.start(goblin);
    fillBoard(ATTACK_2);

    press("Enter");
    await fight;

    expect(pc.hp).toBe(0);
    expect(pc.getXY()).toBeNull();
    expect(logNode.textContent).toContain("The off-by-one error strikes at you and crushes you!");
    expect(logNode.textContent).toContain("Game over!");
    expect(actors.getQueue()).toEqual([]);
  });
});
