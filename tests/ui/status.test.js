// @vitest-environment jsdom
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import * as status from "../../src/ui/status.js";
import * as pubsub from "../../src/util/pubsub.js";
import * as actors from "../../src/util/actors.js";
import pc from "../../src/being/pc.js";
import Level from "../../src/level/level.js";
import XY from "../../src/util/xy.js";
import { BugReport, PrintStatement } from "../../src/item/items.js";
import { centerRoom } from "../../src/level/room.js";

let node;

beforeAll(() => {
  node = document.createElement("div");
  node.classList.add("hidden");
  document.body.appendChild(node);
  status.init(node);
});

beforeEach(() => {
  actors.clear();
  pc.inventory.getItems().splice(0);
  pc.hp = pc.maxhp;
  pc.mana = pc.maxmana;
});

describe("status panel", () => {
  it("is revealed on init", () => {
    expect(node.classList.contains("hidden")).toBe(false);
  });

  it("tolerates updating before the player has a level", () => {
    status.update();
    expect(node.textContent).toContain("You have:");
    expect(node.textContent).not.toContain("Tower floor");
  });

  it("shows the layer, health and focus", async () => {
    let level = new Level(4);
    level.carveRoom(centerRoom(new XY(2, 2)));
    await level.activate(new XY(0, 0), pc);
    pc.hp = 7;

    status.update();

    expect(node.textContent).toContain("Layer 4.");
    expect(node.textContent).toContain(`7/${pc.maxhp} health`);
    expect(node.textContent).toContain(`${pc.mana}/${pc.maxmana} focus`);
  });

  it("colours health from red to green", () => {
    pc.hp = 0;
    status.update();
    let empty = node.querySelector("li span").style.color;
    pc.hp = pc.maxhp;
    status.update();
    let full = node.querySelector("li span").style.color;
    expect(empty).toBe("rgb(255, 0, 0)");
    expect(full).toBe("rgb(0, 255, 0)");
  });

  it("counts gold on the first line and lists other items below", () => {
    let gold = new BugReport();
    gold.amount = 3;
    pc.inventory.addItem(gold);
    let dagger = new PrintStatement();
    pc.inventory.addItem(dagger);

    status.update();

    let lines = Array.from(node.querySelectorAll("li")).map((li) => li.textContent);
    expect(lines[0]).toContain("3 bug reports");
    expect(lines).toHaveLength(2);
    expect(lines[1]).toContain(String(dagger));
    if (dagger.modifier) {
      expect(lines[1]).toContain(`(${dagger.modifier > 0 ? "+" : ""}${dagger.modifier})`);
    } else {
      expect(lines[1]).not.toContain("(");
    }
  });

  it("redraws when a status change is announced", () => {
    status.update();
    pc.hp = 1;
    pubsub.publish("status-change");
    expect(node.textContent).toContain(`1/${pc.maxhp} health`);
  });
});

describe("combat-skewing items", () => {
  it("shows the glyph of the block kind the item favours", () => {
    pc.inventory.addItem({
      getType: () => "tool",
      toString: () => "debugger of patching",
      modifier: 2,
      combat: "a1",
    });

    status.update();

    let line = Array.from(node.querySelectorAll("li")).at(-1);
    expect(line.textContent).toContain("debugger of patching (+2) (++)");
    expect(line.querySelector("strong").style.color).toBe("rgb(0, 255, 0)");
  });
});
