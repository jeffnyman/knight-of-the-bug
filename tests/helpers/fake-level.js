import * as cells from "../../src/level/cells.js";

// A stand-in for a real Level: just enough bookkeeping for beings and
// items to be placed, looked up and removed. Keys are XY strings.
export default class FakeLevel {
  constructor(danger = 1) {
    this.danger = danger;
    this.beings = {};
    this.items = {};
    this.cells = {};
  }

  setBeing(xy, being) {
    this.beings[xy] = being;
  }

  setItem(xy, item) {
    this.items[xy] = item;
  }

  getItem(xy) {
    return this.items[xy];
  }

  setCell(xy, cell) {
    this.cells[xy] = cell;
  }

  getCell(xy) {
    return this.cells[xy] || cells.WALL;
  }

  getEntity(xy) {
    return this.beings[xy] || this.items[xy] || this.getCell(xy);
  }
}
