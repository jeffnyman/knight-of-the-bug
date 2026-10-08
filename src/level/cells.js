import Entity, {
  BLOCKS_NONE,
  BLOCKS_MOVEMENT,
  BLOCKS_LIGHT,
} from "../entity.js";
import * as log from "../ui/log.js";
import * as pubsub from "../util/pubsub.js";
import { hasBug } from "../util/bugs.js";

// The static parts of a layer: floors, walls, doors, and the few special
// cells that have behaviour of their own.

// Passable, but it may cut you on the way through.
export class TangledCode extends Entity {
  constructor() {
    super({ ch: "%", fg: "#483", name: "tangled code" });
  }

  // "tangled code" is a mass noun, so it takes no article.
  describeA() {
    return this.toString();
  }
}

// The goal of the hunt: the feature lying dormant on the top layer. It
// wakes once the Bug guarding it is crushed.
export class Feature extends Entity {
  constructor() {
    super({ ch: "F", fg: "#ff0", name: "dormant feature" });
    this.blocks = BLOCKS_MOVEMENT;
    this._awake = false;
  }

  isAwake() {
    return this._awake;
  }

  wake() {
    this._awake = true;
    this._visual.name = "restored feature";
    this._visual.fg = "#0f0";
  }
}

export class Pillar extends Entity {
  constructor() {
    super({ ch: "T", fg: "#fff", name: "pillar" });
    this.blocks = BLOCKS_MOVEMENT;
  }
}

export class Floor extends Entity {
  constructor() {
    super({ ch: ".", fg: "#aaa", name: "stone floor" });
  }
}

export class Wall extends Entity {
  constructor() {
    super({ ch: "#", fg: "#666", name: "solid wall" });
    this.blocks = BLOCKS_LIGHT;
  }
}

// Grass and trees are only ever drawn outside the tower, so they have no
// name: the player can never stand next to them.
export class Grass extends Entity {
  constructor(ch) {
    super({ ch, fg: "#693" });
  }
}

export class Tree extends Entity {
  constructor() {
    super({ ch: "T", fg: "green" });
  }
}

export class Door extends Entity {
  constructor(closed) {
    super({ ch: "/", fg: "#963" });

    if (closed) {
      this._close();
    } else {
      this._open();
    }
  }

  isOpen() {
    return this._isOpen;
  }

  _close() {
    this.blocks = BLOCKS_LIGHT;
    this._visual.ch = "+";
    this._visual.name = "closed door";
    this._isOpen = false;
  }

  _open() {
    this.blocks = BLOCKS_NONE;
    this._visual.ch = "/";
    this._visual.name = "open door";
    this._isOpen = true;
  }

  // Opening or closing a door changes what can be seen through it, so
  // anyone tracking visibility is told about it.
  close() {
    this._close();
    pubsub.publish("topology-change", this);
  }

  open() {
    this._open();
    if (!hasBug("door-blind")) {
      pubsub.publish("topology-change", this);
    }
  }
}

export class Staircase extends Entity {
  constructor(up, callback) {
    let ch = up ? "<" : ">";
    let fg = "#aaa";
    let name = `staircase leading ${up ? "up" : "down"}`;
    super({ ch, fg, name });

    this._callback = callback;
  }

  // The callback moves the given being to the connected layer and returns
  // a promise that settles once the new layer is active.
  activate(who) {
    log.add("You enter the staircase...");
    return this._callback(who);
  }
}

// Plain cells have no state of their own, so a layer shares one instance
// of each. ROOM and CORRIDOR look identical but are kept distinct so that
// the generator can tell where a room ends and a corridor begins.
export const ROOM = new Floor();
export const CORRIDOR = new Floor();
export const WALL = new Wall();
export const TANGLED_CODE = new TangledCode();
