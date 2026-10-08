import { FOV, RNG } from "rot-js";
import XY from "../util/xy.js";
import Being from "./being.js";
import { Colleague } from "./beings.js";
import { BLOCKS_MOVEMENT, BLOCKS_LIGHT } from "../entity.js";
import { ATTACK_1, ATTACK_2, MAGIC_1, MAGIC_2 } from "../combat/types.js";
import * as combat from "../combat/combat.js";
import * as keyboard from "../util/keyboard.js";
import * as actors from "../util/actors.js";
import * as pubsub from "../util/pubsub.js";
import * as rules from "../rules.js";
import * as log from "../ui/log.js";
import * as cells from "../level/cells.js";
import { format } from "../util/format.js";
import choice from "../ui/choice.js";

// The relative frequency of each block kind on the combat board. Carried
// items of a matching "combat" kind add to these weights.
const COMBAT_OPTIONS = {
  [ATTACK_1]: 2,
  [ATTACK_2]: 2,
  [MAGIC_1]: 2,
  [MAGIC_2]: 2,
};

// One-time hints, shown the first time each situation comes up.
const TUTORIAL = {
  staircase: false,
  item: false,
  door: false,
  enemy: false,
};

// The player character. There is exactly one, exported below. Its turn
// is a promise that stays pending until a key press resolves it.
class PC extends Being {
  constructor() {
    super({ ch: "@", fg: "#fff", name: "you" });
    this._resolve = null; // ends the current turn
    this._maxDanger = 1;
    this.fov = {};

    pubsub.subscribe("topology-change", this);
  }

  describeThe() {
    return this.toString();
  }

  describeA() {
    return this.toString();
  }

  describeIt() {
    return this.toString();
  }

  describeVerb(verb) {
    return verb;
  }

  getCombatOption() {
    let options = Object.assign({}, COMBAT_OPTIONS);
    this.inventory.getItems().forEach((item) => {
      if (item.combat) {
        options[item.combat] += 1;
      }
    });
    return RNG.getWeightedValue(options);
  }

  act() {
    log.pause();
    let promise = new Promise((resolve) => (this._resolve = resolve));

    if (RNG.getUniform() < rules.REGEN_HP) {
      this.adjustStat("hp", 1);
    }
    if (RNG.getUniform() < rules.REGEN_MANA) {
      this.adjustStat("mana", 1);
    }

    promise = promise.then(() => keyboard.pop());
    keyboard.push(this);

    return promise;
  }

  handleKeyEvent(event) {
    if (keyboard.isSpace(event)) {
      return this._wait();
    }

    if (keyboard.isEnter(event)) {
      return this._activate(this._xy);
    }

    let direction = keyboard.getDirection(event);
    if (!direction) {
      return;
    }

    let xy = this._xy.plus(direction);
    if (keyboard.hasModifier(event)) {
      this._interact(xy);
    } else {
      this._move(xy);
    }
  }

  handleMessage(message) {
    if (message == "topology-change") {
      this._updateFOV();
    }
  }

  adjustStat(stat, diff) {
    super.adjustStat(stat, diff);
    pubsub.publish("status-change");
  }

  die() {
    super.die();
    actors.clear();
    log.pause();
    log.add("Game over! Reload the page to try again...");
  }

  moveTo(xy, level) {
    super.moveTo(xy, level);
    if (!this._xy) {
      return;
    }

    this._updateFOV();

    if (level && level.danger > this._maxDanger) {
      this._maxDanger = level.danger;
      log.add("You feel healthier.");
      this.maxhp += rules.LEVEL_HP;
      this.adjustStat("hp", rules.LEVEL_HP);
    }

    // getEntity would return us, since we are standing here, so look at
    // the cell and the item directly.
    let cell = this._level.getCell(this._xy);
    if (cell == cells.TANGLED_CODE && RNG.getUniform() < rules.TANGLED_CODE_CHANCE) {
      log.add(
        "You make your way through %s. Ouch! You cut yourself on a sharp edge.",
        cell,
      );
      this.adjustStat("hp", -1);
    }

    let item = this._level.getItem(this._xy);
    if (item) {
      log.add("%A is lying here.", item);
      if (!TUTORIAL.item) {
        log.add("To pick it up, press {#fff}Enter{}.");
        TUTORIAL.item = true;
      }
      return;
    }

    if (cell instanceof cells.Door) {
      log.add("You pass through %a.", cell);
    } else if (cell instanceof cells.Staircase) {
      log.add("%A is here.", cell);
      if (!TUTORIAL.staircase) {
        TUTORIAL.staircase = true;
        log.add("To use the staircase, press {#fff}Enter{}.");
      }
    }
  }

  _wait() {
    log.add("You wait a bit.");
    this._resolve();
  }

  // Enter: pick up whatever is here, or use the cell (a staircase).
  _activate(xy) {
    let item = this._level.getItem(xy);
    if (item) {
      item.pick(this);
      this._resolve();
      return;
    }

    let cell = this._level.getCell(xy);
    if (cell.activate) {
      cell.activate(this).then(() => this._resolve());
    } else {
      log.add("There is nothing you can do here.");
    }
  }

  // Modifier + direction: open or close a door, or deal with a being.
  _interact(xy) {
    let entity = this._level.getEntity(xy);

    if (entity instanceof cells.Door) {
      if (entity.isOpen()) {
        log.add("You close the door.");
        entity.close();
      } else {
        log.add("You open the door.");
        entity.open();
      }
      return this._resolve(); // a door interaction uses up the turn
    }

    log.add("You see %a.", entity);

    if (entity instanceof Being) {
      this._interactWithBeing(entity);
    }
  }

  _chat(being) {
    let text = being.getChat();
    if (text) {
      log.add(`%The says, "${text}"`, being);
    } else {
      log.add("%The does not say anything.", being);
    }
  }

  _attack(being) {
    log.add("You start debugging %the.", being);
    combat.start(being).then(() => this._resolve());
  }

  _poke(being) {
    log.add("%The does not seem to be amused!", being);
    this._resolve(); // a poke uses up the turn
  }

  _interactWithBeing(being) {
    let callbacks = [];
    let options = [];

    callbacks.push(() => this._poke(being));
    options.push(format("Poke %it to see what happens", being, being));

    callbacks.push(() => this._chat(being));
    options.push(format("Talk to %it", being));

    if (!(being instanceof Colleague)) {
      callbacks.push(() => this._attack(being));
      options.push(format("Debug %it", being));
    }

    choice(options).then((index) => {
      if (index == -1) {
        log.add("You decide to do nothing.");
        return;
      }
      callbacks[index]();
    });
  }

  _move(xy) {
    let entity = this._level.getEntity(xy);

    if (entity.blocks >= BLOCKS_MOVEMENT) {
      log.add("You bump into %a.", entity);

      if (entity instanceof cells.Door && !TUTORIAL.door) {
        TUTORIAL.door = true;
        log.add(
          "To interact with stuff, press both a {#fff}modifier key{} (Ctrl, Alt, Shift or Command) and a {#fff}direction key{} (used for movement).",
        );
      }

      if (entity instanceof Being && !TUTORIAL.enemy) {
        TUTORIAL.enemy = true;
        log.add(
          "If you wish to interact with beings (debug them, for example), press both a {#fff}modifier key{} (Ctrl, Alt, Shift or Command) and a {#fff}direction key{} (used for movement). If someone is simply in your way, {#fff}Space{} waits a turn.",
        );
      }

      return;
    }

    this.moveTo(xy);
    this._resolve(); // a successful move uses up the turn
  }

  _updateFOV() {
    let level = this._level;
    if (!level || !this._xy) {
      return; // nowhere yet, nothing to see
    }

    let fov = new FOV.PreciseShadowcasting((x, y) => {
      return level.getEntity(new XY(x, y)).blocks < BLOCKS_LIGHT;
    });

    let newFOV = {};
    fov.compute(this._xy.x, this._xy.y, rules.PC_SIGHT, (x, y) => {
      let xy = new XY(x, y);
      newFOV[xy] = xy;
    });
    this.fov = newFOV;

    pubsub.publish("visibility-change", this, { xy: this._xy });
  }
}

export default new PC();
