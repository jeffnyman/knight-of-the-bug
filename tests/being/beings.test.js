import { beforeEach, describe, expect, it } from "vitest";
import { RNG } from "rot-js";
import * as beings from "../../src/being/beings.js";
import * as rules from "../../src/rules.js";
import Being from "../../src/being/being.js";
import FakeLevel from "../helpers/fake-level.js";
import XY from "../../src/util/xy.js";
import * as pubsub from "../../src/util/pubsub.js";

beforeEach(() => RNG.setSeed(5));

const BUGS = [
  beings.Typo,
  beings.Warning,
  beings.OffByOne,
  beings.NullPointer,
  beings.RaceCondition,
  beings.DeadCode,
  beings.InfiniteLoop,
  beings.Regression,
  beings.EdgeCase,
  beings.Heisenbug,
  beings.StackOverflow,
  beings.FlakyTest,
];

describe("bugs", () => {
  it("are all beings with a danger rating and a bug report to collect", () => {
    BUGS.forEach((Bug) => {
      let bug = new Bug();
      expect(bug).toBeInstanceOf(Being);
      expect(Bug.danger).toBeGreaterThanOrEqual(1);
      expect(Bug.danger).toBeLessThanOrEqual(rules.LAST_LEVEL);
      expect(bug.inventory.getItemByType("report")).toBeDefined();
      expect(bug.getChat()).toBeNull();
    });
  });

  it("start at full health", () => {
    BUGS.forEach((Bug) => {
      let bug = new Bug();
      expect(bug.hp).toBe(bug.maxhp);
      expect(bug.mana).toBe(bug.maxmana);
    });
  });

  it("take the right article", () => {
    expect(new beings.Typo().describeA()).toBe("a typo");
    expect(new beings.OffByOne().describeA()).toBe("an off-by-one error");
    expect(new beings.InfiniteLoop().describeA()).toBe("an infinite loop");
    expect(new beings.EdgeCase().describeA()).toBe("an edge case");
    expect(new beings.Heisenbug().describeA()).toBe("a heisenbug");
  });

  it("are hostile about as often as the rules say", () => {
    let hostile = 0;
    for (let i = 0; i < 300; i++) {
      if (new beings.Typo().ai.hostile) {
        hostile++;
      }
    }
    expect(hostile / 300).toBeGreaterThan(rules.HOSTILE_CHANCE - 0.1);
    expect(hostile / 300).toBeLessThan(rules.HOSTILE_CHANCE + 0.1);
  });

  it("gives the typo a single hit point and no focus", () => {
    let typo = new beings.Typo();
    expect(typo.hp).toBe(1);
    expect(typo.maxmana).toBe(0);
  });

  it("roots flaky tests in place", () => {
    expect(new beings.FlakyTest().ai.mobile).toBe(false);
    expect(new beings.Typo().ai.mobile).toBe(true);
  });

  it("refers to bugs as it", () => {
    expect(new beings.RaceCondition().describeIt()).toBe("it");
    expect(new beings.Typo().describeIt()).toBe("it");
  });

  it("sometimes arms dead code, infinite loops and stack overflows", () => {
    let armed = 0;
    for (let i = 0; i < 50; i++) {
      let deadCode = new beings.DeadCode();
      let tool = deadCode.inventory.getItemByType("tool");
      expect(tool).toBeDefined();
      let plain = String(tool)
        .replace(/^(handy|clunky|legendary) /, "")
        .replace(/ of .*$/, "");
      expect(["print statement", "debugger"]).toContain(plain);
      if (new beings.InfiniteLoop().inventory.getItemByType("tool")) {
        armed++;
      }
    }
    expect(armed).toBeGreaterThan(5);
    expect(armed).toBeLessThan(45);
  });
});

describe("Colleague", () => {
  it("is never hostile and has no danger rating", () => {
    expect(beings.Colleague.danger).toBeUndefined();
    for (let i = 0; i < 20; i++) {
      expect(new beings.Colleague().ai.hostile).toBe(false);
    }
  });

  it("gets a random seniority, role and colour", () => {
    let names = new Set();
    for (let i = 0; i < 50; i++) {
      let colleague = new beings.Colleague();
      expect(String(colleague)).toMatch(
        /^(junior|senior|staff|principal|freelance|veteran) (tester|developer|debugger|reviewer)$/,
      );
      expect(colleague.getVisual().ch).toBe(String(colleague).split(" ")[1].charAt(0));
      expect(colleague.getVisual().fg).toMatch(/^rgb\(/);
      names.add(String(colleague));
    }
    expect(names.size).toBeGreaterThan(5);
  });

  it("is referred to as them", () => {
    expect(new beings.Colleague().describeIt()).toBe("them");
  });

  it("chats about the hunt on ordinary layers", () => {
    let colleague = new beings.Colleague();
    colleague.moveTo(new XY(0, 0), new FakeLevel(3));
    expect(colleague.getChat()).not.toMatch(/\bBug\b|lucky/);
  });

  it("warns about the Bug on the top layer", () => {
    let colleague = new beings.Colleague();
    colleague.moveTo(new XY(0, 0), new FakeLevel(rules.LAST_LEVEL));
    expect(colleague.getChat()).toMatch(/\bBug\b|lucky/);
  });

  it("can chat before being placed on a layer", () => {
    expect(typeof new beings.Colleague().getChat()).toBe("string");
  });
});

describe("TheBug", () => {
  it("is hostile, rooted, tough and never produced by the factory", () => {
    let bug = new beings.TheBug();
    expect(beings.TheBug.danger).toBeUndefined();
    expect(bug.ai.hostile).toBe(true);
    expect(bug.ai.mobile).toBe(false);
    expect(bug.hp).toBe(rules.BUG_HP);
    expect(bug.maxhp).toBe(rules.BUG_HP);
    expect(bug.mana).toBe(rules.BUG_MANA);
    expect(bug.getAttack()).toBe(rules.BUG_ATTACK);
    expect(bug.getDefense()).toBe(rules.BUG_DEFENSE);
  });

  it("is always called the Bug", () => {
    let bug = new beings.TheBug();
    expect(String(bug)).toBe("Bug");
    expect(bug.describeThe()).toBe("the Bug");
    expect(bug.describeA()).toBe("the Bug");
    expect(bug.describeIt()).toBe("it");
  });

  it("announces its own defeat", () => {
    let heard = null;
    let listener = (message, who) => (heard = who);
    pubsub.subscribe("bug-defeated", listener);
    let bug = new beings.TheBug();
    bug.moveTo(new XY(0, 0), new FakeLevel(rules.LAST_LEVEL));

    bug.adjustStat("hp", -bug.hp);

    expect(heard).toBe(bug);
    expect(bug.getXY()).toBeNull();
    pubsub.unsubscribe("bug-defeated", listener);
  });
});
