// @vitest-environment jsdom
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { RNG } from "rot-js";

vi.mock("../../src/combat/combat.js", () => ({
  init: vi.fn(),
  start: vi.fn(() => Promise.resolve()),
}));

import * as combat from "../../src/combat/combat.js";
import pc from "../../src/being/pc.js";
import Level from "../../src/level/level.js";
import * as cells from "../../src/level/cells.js";
import * as keyboard from "../../src/util/keyboard.js";
import * as actors from "../../src/util/actors.js";
import * as log from "../../src/ui/log.js";
import * as rules from "../../src/rules.js";
import XY from "../../src/util/xy.js";
import { BugReport, PrintStatement } from "../../src/item/items.js";
import { Typo, Colleague } from "../../src/being/beings.js";
import { centerRoom } from "../../src/level/room.js";

let logNode;

// A fresh 11x11 room with the player in the middle and a quiet log.
async function freshLevel() {
  let level = new Level(1);
  level.carveRoom(centerRoom(new XY(5, 5)));
  await level.activate(new XY(0, 0), pc);
  logNode.replaceChildren();
  log.pause();
  return level;
}

function press(key, extra = {}) {
  keyboard.dispatch({ key, ...extra });
}

// Lets a resolved choice run its callback.
async function settle() {
  for (let i = 0; i < 5; i++) {
    await Promise.resolve();
  }
}

// Starts a turn, sends keys, and waits for the turn to end.
async function turn(...keys) {
  let promise = pc.act();
  keys.forEach((k) => (typeof k == "string" ? press(k) : press(k.key, k)));
  await promise;
}

beforeAll(() => {
  logNode = document.createElement("div");
  document.body.appendChild(logNode);
  log.init(logNode);
});

beforeEach(() => {
  RNG.setSeed(1);
  actors.clear();
  pc.inventory.getItems().splice(0);
  pc.hp = pc.maxhp;
  pc.mana = pc.maxmana;
});

describe("the player", () => {
  it("moves with the arrow keys and ends the turn", async () => {
    await freshLevel();

    await turn("ArrowRight");
    expect(pc.getXY().is(new XY(1, 0))).toBe(true);

    await turn("ArrowUp");
    expect(pc.getXY().is(new XY(1, -1))).toBe(true);

    await turn("End"); // south-west
    expect(pc.getXY().is(new XY(0, 0))).toBe(true);
  });

  it("bumps into walls without using the turn", async () => {
    await freshLevel();
    pc.moveTo(new XY(5, 0));

    let promise = pc.act();
    press("ArrowRight");
    expect(pc.getXY().is(new XY(5, 0))).toBe(true);
    expect(logNode.textContent).toContain("You bump into a solid wall.");

    press(" ");
    await promise;
    expect(logNode.textContent).toContain("You wait a bit.");
  });

  it("ignores keys that mean nothing", async () => {
    await freshLevel();
    let promise = pc.act();
    press("x");
    press("Shift", { shiftKey: true });
    expect(pc.getXY().is(new XY(0, 0))).toBe(true);
    press(" ");
    await promise;
  });

  it("notices items and picks them up with Enter", async () => {
    let level = await freshLevel();
    level.setItem(new XY(1, 0), new BugReport());

    await turn("ArrowRight");
    expect(logNode.textContent).toContain("A bug report is lying here.");
    expect(logNode.textContent).toContain("To pick it up, press Enter.");

    await turn("Enter");
    expect(pc.inventory.getItemByType("report").amount).toBe(1);
    expect(level.getItem(new XY(1, 0))).toBeNull();
  });

  it("equips a weapon it picks up", async () => {
    let level = await freshLevel();
    let dagger = new PrintStatement();
    level.setItem(new XY(0, 0), dagger);

    await turn("Enter");
    expect(pc.inventory.getItemByType("tool")).toBe(dagger);
    expect(pc.getAttack()).toBe(10 + dagger.modifier);
  });

  it("uses a staircase with Enter", async () => {
    let level = await freshLevel();
    let callback = vi.fn(() => Promise.resolve());
    level.setCell(new XY(1, 0), new cells.Staircase(true, callback));

    await turn("ArrowRight");
    expect(logNode.textContent).toContain("A staircase leading up is here.");

    await turn("Enter");
    expect(callback).toHaveBeenCalledWith(pc);
  });

  it("complains when there is nothing to activate", async () => {
    await freshLevel();
    let promise = pc.act();
    press("Enter");
    expect(logNode.textContent).toContain("There is nothing you can do here.");
    press(" ");
    await promise;
  });

  it("opens and closes doors with a modifier and a direction", async () => {
    let level = await freshLevel();
    let door = new cells.Door(true);
    level.setCell(new XY(1, 0), door);

    let promise = pc.act();
    press("ArrowRight");
    expect(logNode.textContent).toContain("You bump into a closed door.");
    expect(logNode.textContent).toContain("modifier key");
    press(" ");
    await promise;

    await turn({ key: "ArrowRight", shiftKey: true });
    expect(door.isOpen()).toBe(true);
    expect(logNode.textContent).toContain("You open the door.");

    await turn({ key: "ArrowRight", ctrlKey: true });
    expect(door.isOpen()).toBe(false);

    door.open();
    await turn("ArrowRight");
    expect(pc.getXY().is(new XY(1, 0))).toBe(true);
    expect(logNode.textContent).toContain("You pass through an open door.");
  });

  it("offers to attack a monster, and fights when told to", async () => {
    let level = await freshLevel();
    let rat = new Typo();
    rat.moveTo(new XY(1, 0), level);

    let promise = pc.act();
    press("ArrowRight", { altKey: true });
    expect(logNode.textContent).toContain("You see a typo.");
    expect(logNode.textContent).toContain("3 Debug it");

    press("3");
    await promise;

    expect(combat.start).toHaveBeenCalledWith(rat);
    expect(logNode.textContent).toContain("You start debugging the typo.");
  });

  it("does not offer to attack a fellow hero, but will chat", async () => {
    let level = await freshLevel();
    let hero = new Colleague();
    hero.moveTo(new XY(0, 1), level);

    let promise = pc.act();
    press("ArrowDown", { shiftKey: true });
    expect(logNode.textContent).toContain("1 Poke them to see what happens");
    expect(logNode.textContent).toContain("2 Talk to them");
    expect(logNode.textContent).not.toContain("Debug");

    press("2");
    await settle();
    expect(logNode.textContent).toMatch(/says, "/);

    // Chatting does not use the turn.
    press(" ");
    await promise;
  });

  it("can decide to do nothing", async () => {
    let level = await freshLevel();
    new Typo().moveTo(new XY(-1, 0), level);

    let promise = pc.act();
    press("ArrowLeft", { shiftKey: true });
    press("Escape");
    await settle();
    expect(logNode.textContent).toContain("You decide to do nothing.");
    press(" ");
    await promise;
  });

  it("gets a kiss rebuffed", async () => {
    let level = await freshLevel();
    new Typo().moveTo(new XY(-1, 0), level);

    await turn({ key: "ArrowLeft", shiftKey: true }, "1");
    expect(logNode.textContent).toContain("The typo does not seem to be amused!");
  });

  it("sees the room around it and not through walls", async () => {
    await freshLevel();
    expect(new XY(5, 5) in pc.fov).toBe(true);
    expect(new XY(0, -5) in pc.fov).toBe(true);
    expect(new XY(0, -6) in pc.fov).toBe(true); // the wall itself is visible
    expect(new XY(0, -7) in pc.fov).toBe(false); // but nothing behind it
  });

  it("re-evaluates its view when a door changes", async () => {
    let level = await freshLevel();
    level.carveCorridor(new XY(6, 0), new XY(8, 0));
    let door = new cells.Door(true);
    level.setCell(new XY(6, 0), door);
    pc.moveTo(new XY(4, 0));
    expect(new XY(8, 0) in pc.fov).toBe(false);

    door.open();
    expect(new XY(8, 0) in pc.fov).toBe(true);
  });

  it("may get hurt walking through brambles", async () => {
    let level = await freshLevel();
    let hurt = 0;
    for (let i = 0; i < 40; i++) {
      level.setCell(new XY(1, 0), cells.TANGLED_CODE);
      pc.hp = pc.maxhp;
      pc.moveTo(new XY(1, 0));
      if (pc.hp < pc.maxhp) {
        hurt++;
      }
      pc.moveTo(new XY(0, 0));
    }
    expect(hurt).toBeGreaterThan(5);
    expect(hurt).toBeLessThan(35);
    expect(logNode.textContent).toContain("Ouch!");
  });

  it("gains health on reaching a deeper floor", async () => {
    await freshLevel();
    let maxhp = pc.maxhp;
    let deeper = new Level(3);
    deeper.carveRoom(centerRoom(new XY(3, 3)));

    await deeper.activate(new XY(0, 0), pc);

    expect(pc.maxhp).toBe(maxhp + rules.LEVEL_HP);
    expect(logNode.textContent).toContain("You feel healthier.");
  });

  it("ends the game on death", async () => {
    let level = await freshLevel();
    actors.add(pc);

    pc.adjustStat("hp", -pc.hp);

    expect(pc.getXY()).toBeNull();
    expect(level.getEntity(new XY(0, 0))).toBe(cells.ROOM);
    expect(actors.getQueue()).toEqual([]);
    expect(logNode.textContent).toContain("Game over!");
  });

  it("names itself plainly in messages", () => {
    expect(pc.describeThe()).toBe("you");
    expect(pc.describeA()).toBe("you");
    expect(pc.describeIt()).toBe("you");
    expect(pc.describeVerb("hit")).toBe("hit");
  });

  it("draws combat options evenly without items, skewed with them", () => {
    let count = (n) => {
      let seen = {};
      for (let i = 0; i < n; i++) {
        let option = pc.getCombatOption();
        seen[option] = (seen[option] || 0) + 1;
      }
      return seen;
    };

    // Four equal weights: about 25% each. One extra point on a1 makes it
    // 3 of 9, about 33%.
    let even = count(2000);
    Object.values(even).forEach((c) => expect(c).toBeGreaterThan(400));

    pc.inventory.addItem({ getType: () => "weapon", combat: "a1" });
    let skewed = count(2000);
    expect(skewed.a1).toBeGreaterThan(580);
    expect(skewed.a1).toBeLessThan(760);
    pc.inventory.getItems().splice(0);
  });
});
