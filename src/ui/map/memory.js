import { Color, Noise } from "rot-js";
import * as cells from "../../level/cells.js";
import pc from "../../being/pc.js";

// What the player remembers of a level. Cells currently in view are drawn
// live; cells seen earlier are drawn dimmed from memory; cells never seen
// are not drawn at all. Beyond the tower's edge, grass and trees are
// painted from a noise field so the outside looks the same each visit.

const GRASS_1 = new cells.Grass("\"");
const GRASS_2 = new cells.Grass("'");
const TREE = new cells.Tree();

const NOISE = new Noise.Simplex();

const memories = {};

function darken(color) {
  if (!color) {
    return color;
  }
  return Color.toRGB(Color.fromString(color).map((x) => x >> 1));
}

export default class Memory {
  static forLevel(level) {
    if (!(level.id in memories)) {
      memories[level.id] = new this(level);
    }
    return memories[level.id];
  }

  constructor(level) {
    this._level = level;
    this._memoized = {};
  }

  visualAt(xy) {
    if (this._level.isOutside(xy)) {
      let noise = NOISE.get(xy.x / 20, xy.y / 20);
      let entity;
      if (noise < 0) {
        entity = GRASS_1;
      } else if (noise < 0.8) {
        entity = GRASS_2;
      } else {
        entity = TREE;
      }
      return entity.getVisual();
    }

    if (xy in pc.fov) {
      // Remember the cell only: beings and items move on.
      this._memoize(xy, this._level.getCell(xy).getVisual());
      return this._level.getEntity(xy).getVisual();
    }

    if (xy in this._memoized) {
      return this._memoized[xy];
    }

    return null;
  }

  _memoize(xy, visual) {
    this._memoized[xy] = {
      ch: visual.ch,
      fg: darken(visual.fg),
    };
  }
}
