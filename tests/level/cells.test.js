import { afterEach, describe, expect, it, vi } from "vitest";
import * as cells from "../../src/level/cells.js";
import * as pubsub from "../../src/util/pubsub.js";
import { BLOCKS_NONE, BLOCKS_MOVEMENT, BLOCKS_LIGHT } from "../../src/entity.js";

describe("cells", () => {
  it("shares single instances of the plain cells", () => {
    expect(cells.ROOM).toBeInstanceOf(cells.Floor);
    expect(cells.CORRIDOR).toBeInstanceOf(cells.Floor);
    expect(cells.ROOM).not.toBe(cells.CORRIDOR);
    expect(cells.WALL).toBeInstanceOf(cells.Wall);
    expect(cells.TANGLED_CODE).toBeInstanceOf(cells.TangledCode);
  });

  it("walls block light, pillars and the feature block movement, floor blocks nothing", () => {
    expect(cells.WALL.blocks).toBe(BLOCKS_LIGHT);
    expect(new cells.Pillar().blocks).toBe(BLOCKS_MOVEMENT);
    expect(new cells.Feature().blocks).toBe(BLOCKS_MOVEMENT);
    expect(cells.ROOM.blocks).toBe(BLOCKS_NONE);
    expect(cells.TANGLED_CODE.blocks).toBe(BLOCKS_NONE);
  });

  it("describes tangled code without an article", () => {
    expect(cells.TANGLED_CODE.describeA()).toBe("tangled code");
  });

  it("names staircases by direction", () => {
    expect(String(new cells.Staircase(true, () => {}))).toBe("staircase leading up");
    expect(new cells.Staircase(true, () => {}).getVisual().ch).toBe("<");
    expect(String(new cells.Staircase(false, () => {}))).toBe("staircase leading down");
    expect(new cells.Staircase(false, () => {}).getVisual().ch).toBe(">");
  });

  it("hands the activating being to the staircase callback", async () => {
    let callback = vi.fn(() => Promise.resolve("arrived"));
    let staircase = new cells.Staircase(true, callback);
    let who = {};

    await expect(staircase.activate(who)).resolves.toBe("arrived");
    expect(callback).toHaveBeenCalledWith(who);
  });
});

describe("Door", () => {
  let listener = vi.fn();
  pubsub.subscribe("topology-change", listener);

  afterEach(() => listener.mockClear());

  it("starts open or closed as requested", () => {
    let open = new cells.Door(false);
    expect(open.isOpen()).toBe(true);
    expect(open.blocks).toBe(BLOCKS_NONE);
    expect(open.getVisual().ch).toBe("/");
    expect(String(open)).toBe("open door");

    let closed = new cells.Door(true);
    expect(closed.isOpen()).toBe(false);
    expect(closed.blocks).toBe(BLOCKS_LIGHT);
    expect(closed.getVisual().ch).toBe("+");
    expect(String(closed)).toBe("closed door");
  });

  it("announces a topology change when opened or closed", () => {
    let door = new cells.Door(true);

    door.open();
    expect(door.isOpen()).toBe(true);
    expect(listener).toHaveBeenCalledWith("topology-change", door, undefined);

    door.close();
    expect(door.isOpen()).toBe(false);
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it("does not announce anything from its constructor", () => {
    new cells.Door(true);
    new cells.Door(false);
    expect(listener).not.toHaveBeenCalled();
  });
});
