import { describe, expect, it } from "vitest";
import Entity, { BLOCKS_NONE } from "../src/entity.js";
import { format } from "../src/util/format.js";

describe("Entity", () => {
  it("blocks nothing by default", () => {
    expect(new Entity({ ch: ".", fg: "#fff", name: "floor" }).blocks).toBe(BLOCKS_NONE);
  });

  it("exposes its visual and uses the name as its string form", () => {
    let visual = { ch: "r", fg: "#aaa", name: "rat" };
    let entity = new Entity(visual);
    expect(entity.getVisual()).toBe(visual);
    expect(String(entity)).toBe("rat");
  });

  it("describes itself with a definite article", () => {
    expect(new Entity({ name: "rat" }).describeThe()).toBe("the rat");
  });

  it("chooses the indefinite article by the first letter", () => {
    expect(new Entity({ name: "rat" }).describeA()).toBe("a rat");
    expect(new Entity({ name: "orc" }).describeA()).toBe("an orc");
    expect(new Entity({ name: "Elf" }).describeA()).toBe("an Elf");
  });

  it("works with the message formatter", () => {
    let orc = new Entity({ name: "orc" });
    expect(format("%A appears. You hit %the.", orc, orc)).toBe(
      "An orc appears. You hit the orc.",
    );
  });
});
