import { hasBug } from "./util/bugs.js";

// How much an entity gets in the way. The values are ordered so that a
// comparison such as `blocks >= BLOCKS_MOVEMENT` reads naturally.
export const BLOCKS_NONE = 0;
export const BLOCKS_MOVEMENT = 1;
export const BLOCKS_LIGHT = 2;

// Anything that can occupy a cell: floor, wall, door, item, being. Each
// entity carries a "visual" describing how it is drawn and named:
// { ch: "@", fg: "#fff", name: "you" }.
export default class Entity {
  constructor(visual) {
    this._visual = visual;
    this.blocks = BLOCKS_NONE;
  }

  getVisual() {
    return this._visual;
  }

  toString() {
    return this._visual.name;
  }

  // The describe* methods back the %the, %a and friends placeholders of
  // the message formatter.
  describeThe() {
    return `the ${this}`;
  }

  describeA() {
    let first = this._visual.name.charAt(0);
    let vowels = hasBug("an-article") ? /[aei]/i : /[aeiou]/i;
    let article = first.match(vowels) ? "an" : "a";
    return `${article} ${this}`;
  }
}
