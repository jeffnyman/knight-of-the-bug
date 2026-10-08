import { RNG } from "rot-js";
import pc from "./being/pc.js";
import { DIRS } from "./conf.js";
import { BLOCKS_MOVEMENT } from "./entity.js";
import * as rules from "./rules.js";
import * as combat from "./combat/combat.js";
import * as log from "./ui/log.js";

// How autonomous beings spend their turns. Hostile beings chase and
// attack the player once close enough; everyone else just wanders.

function wander(who) {
  if (RNG.getUniform() < rules.AI_IDLE) {
    return Promise.resolve();
  }

  let level = who.getLevel();
  let xy = who.getXY();

  let directions = DIRS.filter((dxy) => {
    let entity = level.getEntity(xy.plus(dxy));
    return entity.blocks < BLOCKS_MOVEMENT;
  });

  if (!directions.length) {
    return Promise.resolve();
  }

  who.moveTo(xy.plus(RNG.getItem(directions)));
  return Promise.resolve();
}

// Steps into whichever free neighbouring cell is nearest the player,
// picking randomly among ties.
function getCloserToPC(who) {
  let best = Infinity;
  let candidates = [];

  DIRS.forEach((dxy) => {
    let xy = who.getXY().plus(dxy);
    let entity = who.getLevel().getEntity(xy);
    if (entity.blocks >= BLOCKS_MOVEMENT) {
      return;
    }

    let distance = xy.dist8(pc.getXY());
    if (distance < best) {
      best = distance;
      candidates = [];
    }

    if (distance == best) {
      candidates.push(xy);
    }
  });

  if (candidates.length) {
    who.moveTo(RNG.getItem(candidates));
  }

  return Promise.resolve();
}

function actHostile(who) {
  let distance = who.getXY().dist8(pc.getXY());

  if (distance == 1) {
    log.add("{#f00}You are attacked by %a!{}", who);
    return combat.start(who);
  }

  if (!who.ai.mobile) {
    return Promise.resolve();
  }

  if (distance <= rules.AI_RANGE) {
    return getCloserToPC(who);
  }

  return wander(who);
}

function actNonHostile(who) {
  if (!who.ai.mobile) {
    return Promise.resolve();
  }

  return wander(who);
}

export function act(who) {
  if (who.ai.hostile) {
    return actHostile(who);
  }

  return actNonHostile(who);
}
