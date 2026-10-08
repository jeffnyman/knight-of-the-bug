import { RNG } from "rot-js";
import XY from "../util/xy.js";
import { RATIO } from "../conf.js";
import * as rules from "../rules.js";
import * as actors from "../util/actors.js";
import * as cells from "./cells.js";
import * as pubsub from "../util/pubsub.js";
import * as map from "../ui/map/map.js";
import * as log from "../ui/log.js";
import * as keyboard from "../util/keyboard.js";
import { hasBug } from "../util/bugs.js";

// Layers are ellipses. The first is small, the ones after it start
// large and shrink as the tower narrows, and the last is smallest of all.
const D1_RADIUS = 15;
const D2_RADIUS = 30;
const LAST1_RADIUS = 20;
const LAST_RADIUS = 10;

export function dangerToRadius(danger) {
  if (danger == 1) {
    return D1_RADIUS;
  }

  if (danger == rules.LAST_LEVEL) {
    return LAST_RADIUS;
  }

  let diff = LAST1_RADIUS - D2_RADIUS;
  let regularCount = rules.LAST_LEVEL - 2;
  if (regularCount == 1) {
    return D2_RADIUS;
  }

  return D2_RADIUS + Math.round(((danger - 2) / (regularCount - 1)) * diff);
}

// One layer of the tower. Cells, items and beings are kept in separate maps keyed
// by XY string; anything not explicitly set is solid wall.
export default class Level {
  constructor(danger) {
    this.danger = this.id = danger;
    this.rooms = [];
    this.start = this.end = null;
    this._beings = {};
    this._items = {};
    this._cells = {};
  }

  // Makes this the current level, placing the given being at xy and
  // queueing every being here to take turns. Returns a promise so that
  // staircases can wait for the arrival to settle.
  activate(xy, who) {
    actors.clear();

    who.moveTo(null); // leave the old level
    map.setLevel(this);
    who.moveTo(xy, this); // arrive on this one

    let beings = Object.values(this._beings).filter((b) => b);
    beings.forEach((being) => actors.add(being));

    pubsub.publish("status-change");

    if (this.danger == rules.LAST_LEVEL) {
      log.add("{#33f}Welcome to the top layer!{}");
      log.add(
        "The dormant feature is here, and so is {#f00}the Bug{} that put it to sleep. Crush it to finish the hunt.",
      );
    } else {
      let label = this.danger + (hasBug("layer-label") ? 1 : 0);
      log.add(`Welcome to layer ${label}.`);
    }

    return Promise.resolve();
  }

  isInside(xy) {
    xy = xy.scale(1, RATIO);
    return xy.norm() < dangerToRadius(this.danger);
  }

  // "Outside" leaves a two-cell margin beyond the floor's edge so that
  // the outer wall is still drawn as wall rather than scenery.
  isOutside(xy) {
    xy = xy.scale(1, RATIO);
    return xy.norm() > dangerToRadius(this.danger) + 2;
  }

  // Drops any carved cell that ended up beyond the floor's edge.
  trim() {
    Object.keys(this._cells).forEach((key) => {
      let xy = XY.fromString(key);
      if (!this.isInside(xy)) {
        delete this._cells[key];
      }
    });
  }

  // True when nothing has been carved anywhere in the room's rectangle.
  fits(room) {
    let xy = new XY();

    for (xy.x = room.lt.x; xy.x <= room.rb.x; xy.x++) {
      for (xy.y = room.lt.y; xy.y <= room.rb.y; xy.y++) {
        if (xy.toString() in this._cells) {
          return false;
        }
      }
    }

    return true;
  }

  // The topmost thing at a position: a being over an item over the cell.
  getEntity(xy) {
    let key = xy.toString();
    return this._beings[key] || this._items[key] || this._cells[key] || cells.WALL;
  }

  setCell(xy, cell) {
    this._cells[xy] = cell;
  }

  getCell(xy) {
    return this._cells[xy] || cells.WALL;
  }

  getItem(xy) {
    return this._items[xy];
  }

  setBeing(xy, being) {
    this._beings[xy] = being;
    pubsub.publish("visual-change", this, { xy });
  }

  setItem(xy, item) {
    this._items[xy] = item;
    pubsub.publish("visual-change", this, { xy });
  }

  carveRoom(room) {
    this.rooms.push(room);
    let xy = new XY();

    for (xy.x = room.lt.x; xy.x <= room.rb.x; xy.x++) {
      for (xy.y = room.lt.y; xy.y <= room.rb.y; xy.y++) {
        this.setCell(xy, cells.ROOM);
      }
    }
  }

  carveCorridor(xy1, xy2) {
    let diff = xy2.minus(xy1);
    let steps = diff.norm8() + 1;

    for (let i = 0; i <= steps; i++) {
      let xy = xy1.lerp(xy2, i / steps).floor();
      this.setCell(xy, cells.CORRIDOR);
    }
  }

  // Turns corridor cells that touch the room's outline into doors, with
  // the given chances of a door existing and of it starting closed. A
  // corridor running along the outline would otherwise become a wall of
  // doors, so a cell next to an existing door is left alone.
  carveDoors(room, options = {}) {
    options = Object.assign({ doorChance: 0.5, closedChance: 0.5 }, options);
    let size = room.rb.minus(room.lt);

    for (let i = -1; i <= size.x + 1; i++) {
      for (let j = -1; j <= size.y + 1; j++) {
        let isCorner =
          (i == -1 || i == size.x + 1) && (j == -1 || j == size.y + 1);
        if (isCorner) {
          continue;
        }

        let isInterior = i > -1 && i <= size.x && j > -1 && j <= size.y;
        if (isInterior) {
          continue;
        }

        let xy = room.lt.plus(new XY(i, j));
        if (this._cells[xy.toString()] != cells.CORRIDOR) {
          continue;
        }

        if (this._hasDoorNextTo(xy)) {
          continue;
        }

        if (RNG.getUniform() > options.doorChance) {
          continue;
        }

        let closed = RNG.getUniform() < options.closedChance;
        this.setCell(xy, new cells.Door(closed));
      }
    }
  }

  _hasDoorNextTo(xy) {
    let neighbours = [new XY(1, 0), new XY(-1, 0), new XY(0, 1), new XY(0, -1)];
    return neighbours.some(
      (dxy) => this.getCell(xy.plus(dxy)) instanceof cells.Door,
    );
  }

  // Played once the Bug is crushed. Resolves when the player presses
  // Escape, after which they are free to wander.
  outro(who) {
    log.pause();
    log.add("{goldenrod}The Bug is crushed!{}");
    log.add(
      "The dormant feature stirs, wakes, and works again. You finished the hunt.",
    );
    log.add("{goldenrod}Congratulations{}!");
    log.pause();

    let gold = who.inventory.getItemByType("report");
    if (gold) {
      let color = gold.getVisual().fg;
      log.add(
        `Furthermore, you filed a total of {${color}}${gold.amount}{} bug reports.`,
      );
      log.pause();
    }

    log.add("The game is over now, but you are free to look around.");
    log.add("{#fff}Press Escape to continue...{}");

    map.deactivate();

    return new Promise((resolve) => {
      let handleKeyEvent = (event) => {
        if (!keyboard.isEscape(event)) {
          return;
        }
        map.activate();
        keyboard.pop();
        resolve();
      };
      keyboard.push({ handleKeyEvent });
    });
  }
}
