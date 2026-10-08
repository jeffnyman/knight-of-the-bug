import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import XY from "../../src/util/xy.js";
import Being from "../../src/being/being.js";
import Inventory from "../../src/being/inventory.js";
import * as actors from "../../src/util/actors.js";
import * as pubsub from "../../src/util/pubsub.js";
import * as cells from "../../src/level/cells.js";
import { format } from "../../src/util/format.js";
import FakeLevel from "../helpers/fake-level.js";

function rat() {
  return new Being({ ch: "r", fg: "#aaa", name: "rat" });
}

describe("Inventory", () => {
  let listener = vi.fn();
  pubsub.subscribe("status-change", listener);
  afterEach(() => listener.mockClear());

  it("adds and removes items, announcing each change", () => {
    let inventory = new Inventory();
    let sword = { getType: () => "weapon" };

    inventory.addItem(sword);
    expect(inventory.getItems()).toEqual([sword]);
    expect(listener).toHaveBeenCalledTimes(1);

    inventory.removeItem(sword);
    expect(inventory.getItems()).toEqual([]);
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it("finds the first item of a type", () => {
    let inventory = new Inventory();
    let a = { getType: () => "weapon" };
    let b = { getType: () => "weapon" };
    let c = { getType: () => "shield" };
    inventory.addItem(a).addItem(b).addItem(c);

    expect(inventory.getItemByType("weapon")).toBe(a);
    expect(inventory.getItemByType("shield")).toBe(c);
    expect(inventory.getItemByType("helmet")).toBeUndefined();
  });
});

describe("Being", () => {
  beforeEach(() => actors.clear());

  it("starts with default stats and an empty inventory", () => {
    let being = rat();
    expect(being.hp).toBe(20);
    expect(being.maxhp).toBe(20);
    expect(being.mana).toBe(50);
    expect(being.getAttack()).toBe(10);
    expect(being.getDefense()).toBe(10);
    expect(being.inventory.getItems()).toEqual([]);
    expect(being.getXY()).toBeNull();
    expect(being.getLevel()).toBeNull();
  });

  it("adds item modifiers to attack and defense", () => {
    let being = rat();
    being.inventory.addItem({ getType: () => "weapon", modifies: "attack", modifier: 3 });
    being.inventory.addItem({ getType: () => "shield", modifies: "defense", modifier: -1 });
    being.inventory.addItem({ getType: () => "gold" });

    expect(being.getAttack()).toBe(13);
    expect(being.getDefense()).toBe(9);
  });

  it("clamps stats between zero and their maximum", () => {
    let being = rat();
    being.adjustStat("mana", 100);
    expect(being.mana).toBe(50);
    being.adjustStat("mana", -100);
    expect(being.mana).toBe(0);
    being.adjustStat("hp", -5);
    expect(being.hp).toBe(15);
  });

  it("occupies and leaves positions on a level", () => {
    let level = new FakeLevel();
    let being = rat();

    being.moveTo(new XY(1, 1), level);
    expect(level.getEntity(new XY(1, 1))).toBe(being);
    expect(being.getLevel()).toBe(level);

    being.moveBy(new XY(1, 0));
    expect(level.getEntity(new XY(1, 1))).toBe(cells.WALL);
    expect(level.getEntity(new XY(2, 1))).toBe(being);
    expect(being.getXY().is(new XY(2, 1))).toBe(true);
  });

  it("dies at zero health, leaving the level and the turn queue", () => {
    let level = new FakeLevel();
    let being = rat();
    being.moveTo(new XY(0, 0), level);
    actors.add(being);

    being.adjustStat("hp", -20);

    expect(being.hp).toBe(0);
    expect(being.getXY()).toBeNull();
    expect(level.getEntity(new XY(0, 0))).toBe(cells.WALL);
    expect(actors.getQueue()).toEqual([]);
  });

  it("drops one carried item when dying on floor", () => {
    let level = new FakeLevel();
    let here = new XY(0, 0);
    level.setCell(here, cells.ROOM);
    let being = rat();
    being.moveTo(here, level);
    let coin = { getType: () => "gold" };
    being.inventory.addItem(coin);

    being.die();

    expect(level.getItem(here)).toBe(coin);
    expect(being.inventory.getItems()).toEqual([]);
  });

  it("drops nothing when dying somewhere that is not floor", () => {
    let level = new FakeLevel();
    let here = new XY(0, 0);
    level.setCell(here, cells.TANGLED_CODE);
    let being = rat();
    being.moveTo(here, level);
    being.inventory.addItem({ getType: () => "gold" });

    being.die();

    expect(level.getItem(here)).toBeUndefined();
  });

  it("takes an idle turn by default", async () => {
    await expect(rat().act()).resolves.toBeUndefined();
  });

  it("supplies pronouns and verb agreement to the formatter", () => {
    let it = rat();
    let her = rat();
    her.sex = 1;
    let him = rat();
    him.sex = 2;

    expect(format("%it", it)).toBe("it");
    expect(format("%it", her)).toBe("her");
    expect(format("%It", him)).toBe("Them");
    expect(format("%{verb,hit}", it)).toBe("hits");
    expect(format("%{verb,miss}", it)).toBe("misses");
    expect(format("%{verb,do}", it)).toBe("does");
    expect(format("%The %{verb,kill} %it!", it, it, her)).toBe("The rat kills her!");
  });
});
