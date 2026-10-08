// @vitest-environment jsdom
import { beforeAll, describe, expect, it, vi } from "vitest";

// jsdom has no 2D canvas; record the calls instead.
function fakeContext(canvas) {
  return {
    canvas,
    fillText: vi.fn(),
    strokeRect: vi.fn(),
  };
}
let ctx = null;
HTMLCanvasElement.prototype.getContext = function () {
  ctx = fakeContext(this);
  return ctx;
};

import * as ui from "../../src/ui/combat.js";
import Board from "../../src/combat/board.js";
import XY from "../../src/util/xy.js";
import { ATTACK_1, ATTACK_2, COLORS } from "../../src/combat/types.js";

let parent;

beforeAll(() => {
  parent = document.createElement("div");
  parent.classList.add("hidden");
  document.body.appendChild(parent);
  ui.init(parent);
});

describe("combat panel", () => {
  it("builds a heading, the canvas and a four-entry legend", () => {
    expect(parent.querySelector("p").textContent).toBe("Debug Session");
    expect(parent.querySelector("canvas")).not.toBeNull();
    let entries = parent.querySelectorAll("li[data-id]");
    expect(entries).toHaveLength(4);
    expect(entries[0].textContent).toContain("You patch");
    expect(entries[1].textContent).toContain("Bug strikes");
    expect(entries[0].querySelector("span").style.color).toBe("rgb(0, 255, 0)");
  });

  it("draws one block per cell and the cursor", () => {
    let board = new Board();
    let xy = new XY();
    for (xy.x = 0; xy.x < 6; xy.x++) {
      for (xy.y = 0; xy.y < 6; xy.y++) {
        board.set(xy, { value: ATTACK_1 });
      }
    }

    ui.draw(board, new XY(2, 3));

    expect(ctx.canvas.width).toBe(180);
    expect(ctx.canvas.height).toBe(180);
    expect(ctx.fillText).toHaveBeenCalledTimes(36);
    expect(ctx.strokeRect).toHaveBeenCalledTimes(1);
    // Cursor at (2,3): x = 2*30, y measured from the bottom.
    expect(ctx.strokeRect).toHaveBeenCalledWith(62, 180 - 4 * 30 + 2, 26, 26);
    expect(ctx.fillStyle).toBe(COLORS[ATTACK_1]);
  });

  it("draws animated blocks at their in-flight position", () => {
    let board = new Board();
    let xy = new XY();
    for (xy.x = 0; xy.x < 6; xy.x++) {
      for (xy.y = 0; xy.y < 6; xy.y++) {
        board.set(xy, { value: ATTACK_2 });
      }
    }
    board.at(new XY(0, 0)).animated = new XY(0, 2.5);
    ctx.fillText.mockClear();

    ui.draw(board, new XY(0, 0));

    let ys = ctx.fillText.mock.calls.map((call) => call[2]);
    expect(ys).toContain(180 - 3 * 30); // the in-flight block at y = 2.5
  });

  it("points the legend at the highlighted segment's kind", () => {
    let board = new Board();
    let xy = new XY();
    for (xy.x = 0; xy.x < 6; xy.x++) {
      for (xy.y = 0; xy.y < 6; xy.y++) {
        board.set(xy, { value: ATTACK_2 });
      }
    }

    ui.draw(board, new XY(0, 0), [new XY(0, 0), new XY(1, 0)]);

    let entries = Array.from(parent.querySelectorAll("li[data-id]"));
    let active = entries.filter((li) => !li.classList.contains("inactive"));
    expect(active).toHaveLength(1);
    expect(active[0].getAttribute("data-id")).toBe(ATTACK_2);

    ui.draw(board, new XY(0, 0), []);
    entries.forEach((li) => expect(li.classList.contains("inactive")).toBe(true));
  });

  it("shows and dims the panel", () => {
    ui.activate();
    expect(parent.classList.contains("hidden")).toBe(false);
    expect(parent.classList.contains("inactive")).toBe(false);

    ui.deactivate();
    expect(parent.classList.contains("inactive")).toBe(true);

    ui.activate();
    expect(parent.classList.contains("inactive")).toBe(false);
  });
});

describe("glyphs (upstream issue #4, colour blindness)", () => {
  it("gives every block kind a different glyph, shown in the legend", () => {
    let glyphs = Array.from(parent.querySelectorAll("li[data-id] span")).map((span) =>
      span.textContent.trim(),
    );
    expect(glyphs).toHaveLength(4);
    expect(new Set(glyphs).size).toBe(4);
    glyphs.forEach((glyph) => expect(glyph).not.toBe("#"));
  });

  it("draws each block with its kind's glyph", () => {
    let board = new Board();
    let xy = new XY();
    for (xy.x = 0; xy.x < 6; xy.x++) {
      for (xy.y = 0; xy.y < 6; xy.y++) {
        board.set(xy, { value: xy.x % 2 ? ATTACK_1 : ATTACK_2 });
      }
    }
    ctx.fillText.mockClear();

    ui.draw(board, new XY(0, 0));

    let drawn = new Set(ctx.fillText.mock.calls.map((call) => call[0]));
    expect(drawn.size).toBe(2);
    expect(drawn.has("#")).toBe(false);
  });
});
