import { beforeEach, describe, expect, it } from "vitest";
import { RNG } from "rot-js";
import XY from "../../src/util/xy.js";
import Being from "../../src/being/being.js";
import Item, { Wearable, Drinkable } from "../../src/item/item.js";
import * as items from "../../src/item/items.js";
import * as rules from "../../src/rules.js";
import { ATTACK_1, ATTACK_2, MAGIC_1, MAGIC_2 } from "../../src/combat/types.js";
import FakeLevel from "../helpers/fake-level.js";

const HERE = new XY(0, 0);

// A being standing on a fake level with the given item under its feet.
function beingStandingOn(item) {
  let level = new FakeLevel();
  let who = new Being({ ch: "@", fg: "#fff", name: "you" });
  who.moveTo(HERE, level);
  level.setItem(HERE, item);
  return { who, level };
}

beforeEach(() => RNG.setSeed(99));

describe("Item", () => {
  it("knows its slot", () => {
    expect(new items.PrintStatement().getType()).toBe("tool");
    expect(new items.UnitTest().getType()).toBe("test");
    expect(new items.CodeReview().getType()).toBe("review");
    expect(new items.TypeChecker().getType()).toBe("checker");
    expect(new items.Coffee().getType()).toBe("drink");
    expect(new items.BugReport().getType()).toBe("report");
  });

  it("is removed from the floor when picked", () => {
    let item = new Item("thing", { ch: "?", fg: "#fff", name: "thing" });
    let { who, level } = beingStandingOn(item);

    item.pick(who);

    expect(level.getItem(HERE)).toBeNull();
  });
});

describe("Wearable", () => {
  it("tools modify attack, everything else modifies defense", () => {
    expect(new items.PrintStatement().modifies).toBe("attack");
    expect(new items.UnitTest().modifies).toBe("defense");
    expect(new items.CodeReview().modifies).toBe("defense");
    expect(new items.TypeChecker().modifies).toBe("defense");
  });

  it("applies at most one prefix from its own list", () => {
    for (let i = 0; i < 100; i++) {
      let tool = new items.PrintStatement();
      let name = String(tool).replace(/ of .*$/, "");
      expect(name).toMatch(/^((handy|clunky|legendary) )?print statement$/);

      let expected = {
        "handy print statement": 2,
        "clunky print statement": 0,
        "legendary print statement": 3,
        "print statement": 1,
      };
      expect(tool.modifier).toBe(expected[name]);
    }
  });

  it("sometimes skews the combat board and says so in its name", () => {
    let suffixed = 0;
    let suffixes = {
      [ATTACK_1]: "patching",
      [ATTACK_2]: "fragility",
      [MAGIC_1]: "refactoring",
      [MAGIC_2]: "corruption",
    };

    for (let i = 0; i < 200; i++) {
      let debugger_ = new items.Debugger();
      if (debugger_.combat) {
        suffixed++;
        expect(String(debugger_).endsWith(` of ${suffixes[debugger_.combat]}`)).toBe(true);
        expect(debugger_.getVisual().fg).toMatch(/^rgb\(/);
      } else {
        expect(String(debugger_)).not.toContain(" of ");
      }
    }

    // Roughly COMBAT_MODIFIER of them; allow a wide margin.
    expect(suffixed / 200).toBeGreaterThan(rules.COMBAT_MODIFIER - 0.15);
    expect(suffixed / 200).toBeLessThan(rules.COMBAT_MODIFIER + 0.15);
  });

  it("goes into the inventory when picked", () => {
    let tool = new items.PrintStatement();
    let { who } = beingStandingOn(tool);

    tool.pick(who);

    expect(who.inventory.getItems()).toContain(tool);
    expect(who.getAttack()).toBe(10 + tool.modifier);
  });

  it("swaps with the carried item of the same slot, dropping the old one", () => {
    let printStatement = new items.PrintStatement();
    let debugger_ = new items.Debugger();
    let { who, level } = beingStandingOn(printStatement);
    printStatement.pick(who);

    level.setItem(HERE, debugger_);
    debugger_.pick(who);

    expect(who.inventory.getItems()).toContain(debugger_);
    expect(who.inventory.getItems()).not.toContain(printStatement);
    expect(level.getItem(HERE)).toBe(printStatement);
  });

  it("keeps items of different slots side by side", () => {
    let tool = new items.PrintStatement();
    let test = new items.UnitTest();
    let { who, level } = beingStandingOn(tool);
    tool.pick(who);
    level.setItem(HERE, test);
    test.pick(who);

    expect(who.inventory.getItems()).toEqual([tool, test]);
    expect(who.getDefense()).toBe(10 + test.modifier);
  });

  it("can be built directly as a Wearable with no prefixes", () => {
    let plain = new Wearable("tool", { ch: "|", fg: "#fff", name: "stick" }, 0, {});
    expect(String(plain).startsWith("stick")).toBe(true);
    expect(plain.modifier).toBe(0);
  });
});

describe("Drinkable", () => {
  it("varies the strength by half, and names the result", () => {
    let seen = new Set();

    for (let i = 0; i < 100; i++) {
      let drink = new Drinkable(10, { ch: "!", fg: "#e00", name: "drink" });
      let name = String(drink);
      seen.add(name);

      if (name == "drink") {
        expect(drink.getStrength()).toBe(10);
      } else if (name == "strong drink") {
        expect(drink.getStrength()).toBe(15);
      } else if (name == "weak drink") {
        expect(drink.getStrength()).toBe(5);
      } else {
        throw new Error(`unexpected drink name: ${name}`);
      }
    }

    expect(seen.size).toBe(3);
  });
});

describe("Coffee", () => {
  it("restores health up to the maximum", () => {
    let coffee = new items.Coffee();
    let { who } = beingStandingOn(coffee);
    who.hp = 5;

    coffee.pick(who);

    expect(who.hp).toBe(Math.min(20, 5 + coffee.getStrength()));
    expect(who.inventory.getItems()).toEqual([]);
  });

  it("never exceeds maximum health", () => {
    let coffee = new items.Coffee();
    let { who } = beingStandingOn(coffee);

    coffee.pick(who);

    expect(who.hp).toBe(who.maxhp);
  });
});

describe("EnergyDrink", () => {
  it("restores focus up to the maximum", () => {
    let drink = new items.EnergyDrink();
    let { who } = beingStandingOn(drink);
    who.mana = 0;

    drink.pick(who);

    expect(who.mana).toBe(drink.getStrength());
  });
});

describe("AllNighter", () => {
  it("is always just called an all-nighter", () => {
    for (let i = 0; i < 20; i++) {
      expect(String(new items.AllNighter())).toBe("all-nighter");
    }
  });

  it("fully heals and drains all focus", () => {
    let allNighter = new items.AllNighter();
    let { who } = beingStandingOn(allNighter);
    who.hp = 1;

    allNighter.pick(who);

    expect(who.hp).toBe(who.maxhp);
    expect(who.mana).toBe(0);
  });
});

describe("BugReport", () => {
  it("is added to the inventory the first time", () => {
    let report = new items.BugReport();
    let { who } = beingStandingOn(report);

    report.pick(who);

    expect(who.inventory.getItemByType("report")).toBe(report);
    expect(report.amount).toBe(1);
  });

  it("stacks onto reports already filed", () => {
    let first = new items.BugReport();
    let second = new items.BugReport();
    let { who, level } = beingStandingOn(first);
    first.pick(who);
    level.setItem(HERE, second);

    second.pick(who);

    expect(who.inventory.getItems()).toEqual([first]);
    expect(first.amount).toBe(2);
  });
});
