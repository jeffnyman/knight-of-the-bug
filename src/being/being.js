import { RNG } from "rot-js";
import Entity, { BLOCKS_MOVEMENT } from "../entity.js";
import Inventory from "./inventory.js";
import * as actors from "../util/actors.js";
import * as cells from "../level/cells.js";
import { hasBug } from "../util/bugs.js";

// Pronoun used by the %it placeholder, indexed by a being's `sex`.
const IT = ["it", "her", "them"];

// Anything that moves and fights: the player, bugs, colleagues. A
// being lives on a level at a position and takes turns via act().
export default class Being extends Entity {
  constructor(visual) {
    super(visual);
    this.inventory = new Inventory();

    this.blocks = BLOCKS_MOVEMENT;
    this._xy = null;
    this._level = null;
    this.attack = 10;
    this.defense = 10;
    this.sex = 0;
    this.hp = this.maxhp = 20;
    this.mana = this.maxmana = 50;
  }

  getXY() {
    return this._xy;
  }

  getLevel() {
    return this._level;
  }

  getAttack() {
    let modifier = this.inventory.getItems().reduce((total, item) => {
      return total + (item.modifies == "attack" ? item.modifier : 0);
    }, 0);
    return this.attack + modifier;
  }

  getDefense() {
    if (hasBug("defense-ignored")) {
      return this.defense;
    }

    let modifier = this.inventory.getItems().reduce((total, item) => {
      return total + (item.modifies == "defense" ? item.modifier : 0);
    }, 0);
    return this.defense + modifier;
  }

  // Changes "hp" or "mana" by diff, clamped between zero and the matching
  // maximum. Running out of health is fatal.
  adjustStat(stat, diff) {
    this[stat] += diff;
    this[stat] = Math.max(this[stat], 0);
    if (!hasBug("health-overflow")) {
      this[stat] = Math.min(this[stat], this[`max${stat}`]);
    }

    if (stat == "hp" && this[stat] == 0) {
      this.die();
    }
  }

  // Removes the being from the level and the turn queue. If it was
  // carrying anything and died on open floor, one random item is dropped.
  die() {
    let level = this._level;
    let xy = this._xy;

    this.moveTo(null);
    actors.remove(this);

    let items = this.inventory.getItems();
    let minimum = hasBug("loot-lost") ? 1 : 0;
    if (items.length > minimum && level.getEntity(xy) instanceof cells.Floor) {
      let item = RNG.getItem(items);
      this.inventory.removeItem(item);
      level.setItem(xy, item);
    }
  }

  act() {
    return Promise.resolve();
  }

  moveBy(dxy) {
    return this.moveTo(this._xy.plus(dxy));
  }

  // Moves to a position, optionally on a different level. Passing null
  // removes the being from the map entirely.
  moveTo(xy, level) {
    if (this._xy) {
      this._level.setBeing(this._xy, null); // leave the old position
    }

    this._level = level || this._level;
    this._xy = xy;

    if (this._xy) {
      this._level.setBeing(this._xy, this); // occupy the new position
    }

    return this;
  }

  describeIt() {
    return IT[this.sex];
  }

  // Third-person singular: "hit" -> "hits", "crush" -> "crushes", "do" -> "does".
  describeVerb(verb) {
    let needsEs = /(s|sh|ch|x|z|o)$/.test(verb);
    return `${verb}${needsEs ? "es" : "s"}`;
  }
}
