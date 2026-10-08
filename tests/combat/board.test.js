import { beforeEach, describe, expect, it } from "vitest";
import { RNG } from "rot-js";
import XY from "../../src/util/xy.js";
import Board from "../../src/combat/board.js";
import { ATTACK_1, ATTACK_2, MAGIC_1, MAGIC_2 } from "../../src/combat/types.js";

const KINDS = [ATTACK_1, ATTACK_2, MAGIC_1, MAGIC_2];

beforeEach(() => RNG.setSeed(6));

// Fills a board from rows of letters, top row first, so the picture in
// the test reads like the screen. "." leaves a gap.
function boardFrom(rows) {
  let board = new Board();
  let size = board.getSize();
  rows.forEach((row, index) => {
    let y = size.y - 1 - index;
    [...row].forEach((ch, x) => {
      let value = { a: ATTACK_1, b: ATTACK_2, c: MAGIC_1, d: MAGIC_2 }[ch];
      board.set(new XY(x, y), value ? { value } : null);
    });
  });
  return board;
}

function picture(board) {
  let size = board.getSize();
  let rows = [];
  for (let y = size.y - 1; y >= 0; y--) {
    let row = "";
    for (let x = 0; x < size.x; x++) {
      let cell = board.at(new XY(x, y));
      row += cell ? { a1: "a", a2: "b", m1: "c", m2: "d" }[cell.value] : ".";
    }
    rows.push(row);
  }
  return rows;
}

describe("Board", () => {
  it("is six by six and empty to start", () => {
    let board = new Board();
    expect(board.getSize().is(new XY(6, 6))).toBe(true);
    expect(board.at(new XY(0, 0))).toBeNull();
    expect(board.at(new XY(5, 5))).toBeNull();
  });

  it("randomizes every cell with a block kind", () => {
    let board = new Board().randomize();
    let xy = new XY();
    for (xy.x = 0; xy.x < 6; xy.x++) {
      for (xy.y = 0; xy.y < 6; xy.y++) {
        expect(KINDS).toContain(board.at(xy).value);
      }
    }
  });

  it("finds the group of connected same-kind blocks without changing the board", () => {
    let board = boardFrom([
      "aabbbb",
      "abbbbb",
      "bbbbbb",
      "bbbbbb",
      "bbbbbb",
      "bbbbbc",
    ]);

    let segment = board.findSegment(new XY(0, 5));
    expect(segment).toHaveLength(3);
    expect(board.at(new XY(0, 5))).not.toBeNull();

    expect(board.findSegment(new XY(5, 0))).toHaveLength(1);
    expect(board.findSegment(new XY(3, 3))).toHaveLength(32);
  });

  it("does not connect diagonally", () => {
    let board = boardFrom([
      "abbbbb",
      "babbbb",
      "bbbbbb",
      "bbbbbb",
      "bbbbbb",
      "bbbbbb",
    ]);
    expect(board.findSegment(new XY(0, 5))).toHaveLength(1);
    expect(board.findSegment(new XY(1, 4))).toHaveLength(1);
  });

  it("lists all segments largest first, covering every block", () => {
    let board = boardFrom([
      "aabbbb",
      "abbbbb",
      "bbbbbb",
      "bbbbbb",
      "bbbbbb",
      "bbbbbc",
    ]);
    let segments = board.getAllSegments();
    expect(segments.map((s) => s.length)).toEqual([32, 3, 1]);
    expect(segments.flat()).toHaveLength(36);
  });

  it("removes a segment when extracting it", () => {
    let board = boardFrom([
      "aabbbb",
      "abbbbb",
      "bbbbbb",
      "bbbbbb",
      "bbbbbb",
      "bbbbbb",
    ]);
    board.extractSegment(new XY(0, 5));
    expect(picture(board)[0]).toBe("..bbbb");
    expect(picture(board)[1]).toBe(".bbbbb");
  });

  it("drops blocks into gaps and refills from the top", () => {
    let board = boardFrom([
      "abcdab",
      "a.cdab",
      "a.cd.b",
      "a..d.b",
      "abcdab",
      "abcdab",
    ]);

    let animation = board.fall();

    let after = picture(board);
    // Column 1 had three gaps: the two survivors sit at the bottom.
    expect(after[5][1]).toBe("b");
    expect(after[4][1]).toBe("b");
    expect(after[3][1]).toBe("b");
    // Column 4 had two gaps: "a" from the top now sits third from bottom.
    expect(after[2][4]).toBe("a");
    // Every cell is filled again.
    after.forEach((row) => expect(row).not.toContain("."));
    // Column 1: 1 moved + 3 new; column 2: 3 moved + 1 new; column 4: 2 moved + 2 new.
    expect(animation._items.length).toBe(4 + 4 + 4);
    animation._items.forEach((item) => {
      expect(item.cell.animated.is(item.from)).toBe(true);
      expect(item.to.y).toBeLessThan(item.from.y);
    });
  });

  it("leaves a full board alone", () => {
    let board = new Board().randomize();
    let before = picture(board);
    let animation = board.fall();
    expect(picture(board)).toEqual(before);
    expect(animation._items).toHaveLength(0);
  });
});
