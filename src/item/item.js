import { Color, RNG } from "rot-js";
import Entity from "../entity.js";
import * as log from "../ui/log.js";
import * as rules from "../rules.js";
import { hasBug } from "../util/bugs.js";
import {
  ATTACK_1,
  ATTACK_2,
  MAGIC_1,
  MAGIC_2,
  COLORS,
} from "../combat/types.js";

// The name suffix an item gains when it skews the combat board.
const SUFFIXES = {
  [ATTACK_1]: "patching",
  [ATTACK_2]: "fragility",
  [MAGIC_1]: "refactoring",
  [MAGIC_2]: "corruption",
};

// Anything that can lie on the floor and be picked up. The type groups
// items that occupy the same inventory slot: "tool", "test", "review",
// "checker", "drink" or "report".
export default class Item extends Entity {
  constructor(type, visual) {
    super(visual);
    this._type = type;
  }

  getType() {
    return this._type;
  }

  // Removes the item from the floor under the given being. Subclasses
  // decide what happens next: wearables go into the inventory, drinks
  // are consumed on the spot.
  pick(who) {
    who.getLevel().setItem(who.getXY(), null);
    log.add("You pick up %the.", this);
  }
}

// Coffee and the like. Half of them come out stronger or weaker than
// standard, and say so in their name.
export class Drinkable extends Item {
  constructor(strength, visual) {
    super("drink", visual);
    this._strength = strength;

    if (RNG.getUniform() > 0.5) {
      let diff = Math.round(strength / 2);
      if (RNG.getUniform() > 0.5) {
        diff *= -1;
      }
      this._strength += hasBug("weak-is-strong") ? Math.abs(diff) : diff;
      this._visual.name = `${diff > 0 ? "strong" : "weak"} ${this._visual.name}`;
    }
  }

  getStrength() {
    return this._strength;
  }

  pick(who) {
    who.getLevel().setItem(who.getXY(), null);
    log.add("You drink %the.", this);
  }
}

// Tools and safeguards. A tool modifies attack; everything else modifies
// defense. A random prefix ("sharp", "rusty"...) may adjust the modifier
// and a random suffix may make the item skew the combat board towards
// one kind of block.
export class Wearable extends Item {
  constructor(type, visual, modifier, prefixes) {
    super(type, visual);
    this.modifies = type == "tool" ? "attack" : "defense";
    this.modifier = modifier;
    this.combat = null;

    let available = Object.keys(prefixes);
    if (available.length > 0 && RNG.getUniform() > 0.5) {
      let prefix = RNG.getItem(available);
      this._visual.name = `${prefix} ${this._visual.name}`;
      this.modifier += prefixes[prefix];
    }

    if (RNG.getUniform() < rules.COMBAT_MODIFIER) {
      let combat = RNG.getItem([ATTACK_1, ATTACK_2, MAGIC_1, MAGIC_2]);
      this.combat = combat;
      this._visual.name = `${this._visual.name} of ${SUFFIXES[combat]}`;

      // Tint the item halfway towards the colour of the block it favours.
      let color1 = Color.fromString(COLORS[combat]);
      let color2 = Color.fromString(this._visual.fg);
      let color3 = Color.interpolate(color1, color2, 0.5);
      this._visual.fg = Color.toRGB(color3);
    }
  }

  // Picking up a wearable swaps it for whatever of the same type is
  // already carried; the old one is dropped where the new one lay.
  pick(who) {
    super.pick(who);

    let other = who.inventory.getItemByType(this._type);
    if (other) {
      who.inventory.removeItem(other);
      who.getLevel().setItem(who.getXY(), other);
      log.add("You drop %the.", other);
    }

    who.inventory.addItem(this);
  }
}
