// @vitest-environment jsdom
//
// The executable answer key. Each test switches one seeded bug on and
// shows the misbehaviour it causes; the ordinary suite shows the correct
// behaviour with every bug off. Together they say what each bug breaks
// and which test would have caught it.
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { RNG } from "rot-js";

vi.mock("../src/ui/combat.js", () => ({
  init: vi.fn(),
  draw: vi.fn(),
  activate: vi.fn(),
  deactivate: vi.fn(),
}));

import { enable, reset } from "../src/util/bugs.js";
import Entity from "../src/entity.js";
import Being from "../src/being/being.js";
import Level from "../src/level/level.js";
import * as cells from "../src/level/cells.js";
import * as combat from "../src/combat/combat.js";
import * as keyboard from "../src/util/keyboard.js";
import * as pubsub from "../src/util/pubsub.js";
import * as actors from "../src/util/actors.js";
import * as log from "../src/ui/log.js";
import pc from "../src/being/pc.js";
import XY from "../src/util/xy.js";
import { Drinkable } from "../src/item/item.js";
import { Typo } from "../src/being/beings.js";
import { centerRoom } from "../src/level/room.js";
import FakeLevel from "./helpers/fake-level.js";

let logNode;

beforeAll(() => {
  logNode = document.createElement("div");
  document.body.appendChild(logNode);
  log.init(logNode);
  combat.init(document.createElement("div"));
});

beforeEach(() => {
  RNG.setSeed(1);
  actors.clear();
  logNode.replaceChildren();
  log.pause();
});

afterEach(() => reset());

describe("an-article (equivalence classes)", () => {
  it("gives 'o' and 'u' words the wrong article", () => {
    enable(["an-article"]);
    expect(new Entity({ name: "open door" }).describeA()).toBe("a open door");
    expect(new Entity({ name: "off-by-one error" }).describeA()).toBe("a off-by-one error");
    expect(new Entity({ name: "unit test" }).describeA()).toBe("a unit test");
    // The rest of the vowel class still works, which is what makes it sneaky.
    expect(new Entity({ name: "edge case" }).describeA()).toBe("an edge case");
    expect(new Entity({ name: "infinite loop" }).describeA()).toBe("an infinite loop");
  });
});

describe("board-edge (boundary values)", () => {
  it("lets the cursor leave the board going left or down, but not right or up", () => {
    enable(["board-edge"]);
    combat.start(new Typo());
    let start = combat.getCursor();
    expect(start.is(new XY(0, 0))).toBe(true);

    keyboard.dispatch({ key: "ArrowLeft" });
    expect(combat.getCursor().x).toBe(-1);
    keyboard.dispatch({ key: "ArrowRight" });
    expect(combat.getCursor().x).toBe(0);

    keyboard.dispatch({ key: "ArrowDown" });
    expect(combat.getCursor().y).toBe(-1);
    keyboard.dispatch({ key: "ArrowUp" });
    expect(combat.getCursor().y).toBe(0);

    for (let i = 0; i < 6; i++) {
      keyboard.dispatch({ key: "ArrowUp" });
    }
    expect(combat.getCursor().y).toBe(0); // wrapping upwards still works
    keyboard.pop();
  });
});

describe("health-overflow (properties and invariants)", () => {
  it("lets health exceed its maximum", () => {
    enable(["health-overflow"]);
    let being = new Being({ ch: "r", fg: "#aaa", name: "typo" });
    being.adjustStat("hp", 5);
    expect(being.hp).toBe(25);
    expect(being.maxhp).toBe(20);
    // The lower bound is still enforced: the invariant is only half broken.
    being.adjustStat("hp", -100);
    expect(being.hp).toBe(0);
  });
});

describe("loot-lost (mutation of a relational operator)", () => {
  it("drops nothing from a being carrying exactly one item", () => {
    enable(["loot-lost"]);
    let level = new FakeLevel();
    let here = new XY(0, 0);
    level.setCell(here, cells.ROOM);
    let being = new Being({ ch: "r", fg: "#aaa", name: "typo" });
    being.moveTo(here, level);
    being.inventory.addItem({ getType: () => "report" });

    being.die();

    expect(level.getItem(here)).toBeUndefined();
    expect(being.inventory.getItems()).toHaveLength(1);
  });

  it("still drops something from a being carrying two", () => {
    enable(["loot-lost"]);
    let level = new FakeLevel();
    let here = new XY(0, 0);
    level.setCell(here, cells.ROOM);
    let being = new Being({ ch: "r", fg: "#aaa", name: "typo" });
    being.moveTo(here, level);
    being.inventory.addItem({ getType: () => "report" });
    being.inventory.addItem({ getType: () => "tool" });

    being.die();

    expect(level.getItem(here)).toBeDefined();
  });
});

describe("door-blind (state and events)", () => {
  it("does not announce an opened door, so the view is stale until the next move", async () => {
    enable(["door-blind"]);
    let listener = vi.fn();
    pubsub.subscribe("topology-change", listener);

    let door = new cells.Door(true);
    door.open();
    expect(door.isOpen()).toBe(true);
    expect(listener).not.toHaveBeenCalled();

    door.close();
    expect(listener).toHaveBeenCalledTimes(1); // closing still announces
    pubsub.unsubscribe("topology-change", listener);

    // Seen from the player's side: the corridor behind the door stays unseen.
    let level = new Level(1);
    level.carveRoom(centerRoom(new XY(5, 5)));
    level.carveCorridor(new XY(6, 0), new XY(8, 0));
    let corridorDoor = new cells.Door(true);
    level.setCell(new XY(6, 0), corridorDoor);
    await level.activate(new XY(4, 0), pc);
    expect(new XY(8, 0) in pc.fov).toBe(false);

    corridorDoor.open();
    expect(new XY(8, 0) in pc.fov).toBe(false);

    pc.moveTo(new XY(5, 0)); // moving recomputes the view
    expect(new XY(8, 0) in pc.fov).toBe(true);
  });
});

describe("layer-label (off by one in output)", () => {
  it("welcomes the player to the layer above the one they are on", async () => {
    enable(["layer-label"]);
    let level = new Level(3);
    level.carveRoom(centerRoom(new XY(2, 2)));

    await level.activate(new XY(0, 0), pc);

    expect(logNode.textContent).toContain("Welcome to layer 4.");
    expect(pc.getLevel().danger).toBe(3); // the status panel would say 3
  });
});

describe("defense-ignored (calculation mutant)", () => {
  it("ignores carried defensive items, though attack items still count", () => {
    enable(["defense-ignored"]);
    let being = new Being({ ch: "r", fg: "#aaa", name: "typo" });
    being.inventory.addItem({ getType: () => "test", modifies: "defense", modifier: 2 });
    being.inventory.addItem({ getType: () => "tool", modifies: "attack", modifier: 3 });

    expect(being.getDefense()).toBe(10);
    expect(being.getAttack()).toBe(13);
  });
});

describe("weak-is-strong (seed-dependent data)", () => {
  it("makes weak drinks as strong as strong ones", () => {
    enable(["weak-is-strong"]);
    let weak = null;
    let strong = null;
    for (let i = 0; i < 100 && !(weak && strong); i++) {
      let drink = new Drinkable(10, { ch: "!", fg: "#e00", name: "coffee" });
      if (String(drink) == "weak coffee") {
        weak = drink;
      }
      if (String(drink) == "strong coffee") {
        strong = drink;
      }
    }

    expect(weak.getStrength()).toBe(15);
    expect(strong.getStrength()).toBe(15);
  });
});
