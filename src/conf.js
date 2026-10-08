import XY from "./util/xy.js";

// Levels are drawn in a monospace font whose glyphs are taller than they
// are wide. This ratio is used to make the circular layers look
// round on screen rather than squashed.
export const RATIO = 1.6;

// The eight compass directions, clockwise starting from north-west. The
// order matters: keyboard handling maps keys onto this list by index.
export const DIRS = [
  new XY(-1, -1),
  new XY(0, -1),
  new XY(1, -1),
  new XY(1, 0),
  new XY(1, 1),
  new XY(0, 1),
  new XY(-1, 1),
  new XY(-1, 0),
];
