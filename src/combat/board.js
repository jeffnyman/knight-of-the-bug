import XY from "../util/xy.js";
import Animation from "./animation.js";
import pc from "../being/pc.js";

// The "Debug Session" board: a square grid of coloured blocks. Blocks are
// stored column by column with y = 0 at the bottom, so that removed blocks
// leave gaps the ones above fall into. Each block is { value, animated }.
const W = 6;
const H = W;

export default class Board {
  constructor() {
    this._data = [];

    for (let i = 0; i < W; i++) {
      let column = [];
      this._data.push(column);
      for (let j = 0; j < H; j++) {
        column.push(null);
      }
    }
  }

  // Fills every cell with a block whose kind is drawn from the player's
  // weighted combat options.
  randomize() {
    this._data.forEach((column) => {
      column.forEach((cell, i) => {
        column[i] = { value: pc.getCombatOption() };
      });
    });
    return this;
  }

  getSize() {
    return new XY(W, H);
  }

  at(xy) {
    return this._data[xy.x][xy.y];
  }

  set(xy, value) {
    this._data[xy.x][xy.y] = value;
  }

  _clone() {
    let clone = new this.constructor();
    clone._data = JSON.parse(JSON.stringify(this._data));
    return clone;
  }

  // Drops blocks into the gaps below them and creates new blocks above to
  // refill each column. Returns the animation describing the movement.
  fall() {
    let animation = new Animation();

    this._data.forEach((column, index) => {
      this._fallColumn(index, animation);
    });

    return animation;
  }

  _fallColumn(x, animation) {
    let totalFall = 0;
    let column = this._data[x];

    column.forEach((cell, y) => {
      if (cell) {
        if (totalFall == 0) {
          return;
        }
        let targetY = y - totalFall;

        column[targetY] = cell;
        column[y] = null;

        animation.add({
          cell,
          from: new XY(x, y),
          to: new XY(x, targetY),
        });
      } else {
        totalFall++;
      }
    });

    for (let i = 0; i < totalFall; i++) {
      let cell = { value: pc.getCombatOption() };
      let sourceY = column.length + i;
      let targetY = sourceY - totalFall;
      column[targetY] = cell;

      animation.add({
        cell,
        from: new XY(x, sourceY),
        to: new XY(x, targetY),
      });
    }
  }

  // The group of same-kind blocks connected to xy, without changing the
  // board.
  findSegment(xy) {
    let contains = (sxy) => sxy.is(xy);
    return this.getAllSegments().filter((segment) => segment.some(contains))[0];
  }

  // Every group of connected same-kind blocks, largest first.
  getAllSegments() {
    let clone = this._clone();
    let segments = [];
    let xy = new XY();

    for (xy.x = 0; xy.x < W; xy.x++) {
      for (xy.y = 0; xy.y < H; xy.y++) {
        if (!clone.at(xy)) {
          continue;
        }
        segments.push(clone.extractSegment(xy));
      }
    }

    return segments.sort((a, b) => b.length - a.length);
  }

  // Removes and returns the group of same-kind blocks connected to xy
  // (orthogonally). Mutates the board.
  extractSegment(xy) {
    let segment = [];
    let value = this.at(xy).value;

    let tryIt = (xy) => {
      if (xy.x < 0 || xy.y < 0 || xy.x >= W || xy.y >= H) {
        return;
      }
      let cell = this.at(xy);
      if (!cell || cell.value != value) {
        return;
      }

      this.set(xy, null);
      segment.push(xy.clone());
      tryIt(xy.plus(new XY(1, 0)));
      tryIt(xy.plus(new XY(-1, 0)));
      tryIt(xy.plus(new XY(0, -1)));
      tryIt(xy.plus(new XY(0, 1)));
    };

    tryIt(xy);
    return segment;
  }
}
