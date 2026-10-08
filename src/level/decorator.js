import { RNG } from "rot-js";
import XY from "../util/xy.js";
import { generate } from "./generator.js";
import { dangerToRadius } from "./level.js";
import * as factory from "../util/factory.js";
import * as beings from "../being/beings.js";
import * as items from "../item/items.js";
import * as cells from "./cells.js";
import * as room from "./room.js";
import * as rules from "../rules.js";
import * as pubsub from "../util/pubsub.js";
import pc from "../being/pc.js";

// Furnishes a generated layer: staircases, doors, tangled code, loot,
// bugs and colleagues. Also remembers every layer made so far so that
// staircases can lead back to layers already visited.
const levels = {};

export function getLevels() {
  return levels;
}

// Draws an arc of tangled code through the walls, as if a thicket had grown
// into the tower from outside.
function decorateTangledCode(level) {
  let radius = dangerToRadius(level.danger);
  let distance = RNG.getUniformInt(2 * radius, 5 * radius);
  let angle = RNG.getUniform() * 2 * Math.PI;

  let center = new XY(Math.cos(angle), Math.sin(angle)).scale(distance);
  let da = radius / distance;

  angle += Math.PI;
  distance += (RNG.getUniform() - 0.5) * radius;

  for (let a = angle - da; a < angle + da; a += 0.01) {
    let xy = center.plus(new XY(Math.cos(a), Math.sin(a)).scale(distance)).round();
    if (!level.isInside(xy)) {
      continue;
    }
    if (level.getEntity(xy) != cells.WALL) {
      continue;
    }
    level.setCell(xy, cells.TANGLED_CODE);
  }
}

// Returns the function a staircase calls to move a being to the floor of
// the given danger, generating that floor on first use.
function staircaseCallback(danger, atStart) {
  return function (who) {
    if (!(danger in levels)) {
      generate(danger);
    }
    let level = levels[danger];
    return level.activate(atStart ? level.start : level.end, who);
  };
}

// The top layer: a single hall with the dormant feature on a pedestal
// between four pillars, the Bug squatting in front of it, and the
// colleagues who got there first standing around at a safe distance.
function decorateLast(level) {
  let radius = dangerToRadius(level.danger);
  level.start = level.rooms[0].center.minus(new XY(radius - 2, 0));

  let bed = level.rooms[0].center.plus(new XY(3, 0));
  let feature = new cells.Feature();
  level.setCell(bed, feature);

  // The Bug sits between the way in and the feature, and must be crushed
  // before the feature can wake.
  let bug = new beings.TheBug();
  bug.moveTo(bed.plus(new XY(-1, 0)), level);

  pubsub.subscribe("bug-defeated", function onDefeat(message, defeated) {
    if (defeated != bug) {
      return;
    }
    pubsub.unsubscribe("bug-defeated", onDefeat);

    feature.wake();
    pubsub.publish("visual-change", level, { xy: bed });

    // The Bug dies in the middle of a combat turn. Let that turn finish and
    // hand the keyboard back to the player before the outro takes it.
    setTimeout(() => level.outro(pc), 0);
  });

  level.setCell(bed.plus(new XY(-1, -1)), new cells.Pillar());
  level.setCell(bed.plus(new XY(+1, -1)), new cells.Pillar());
  level.setCell(bed.plus(new XY(-1, +1)), new cells.Pillar());
  level.setCell(bed.plus(new XY(+1, +1)), new cells.Pillar());

  let xy = new XY();
  for (xy.x = bed.x - 3; xy.x <= bed.x + 3; xy.x++) {
    for (xy.y = bed.y - 3; xy.y <= bed.y + 3; xy.y++) {
      if (xy.is(bed)) {
        continue;
      }
      if (level.getEntity(xy) != cells.ROOM) {
        continue;
      }

      if (xy.dist8(bed) == 1) {
        // The colleagues right by the pedestal stay put.
        let colleague = new beings.Colleague();
        colleague.ai.mobile = false;
        colleague.moveTo(xy.clone(), level);
        continue;
      }

      if (RNG.getUniform() > 0.5) {
        continue;
      }
      let colleague = new beings.Colleague();
      colleague.moveTo(xy.clone(), level);
    }
  }
}

// The first layer is a gentle introduction: a tame typo, a coffee and a
// print statement, one per room, and a closed door on the starting room.
function decorateFirst(level) {
  let features = ["typo", "coffee", "tool"];

  level.rooms.forEach((r) => {
    if (r.center.is(level.start)) {
      level.carveDoors(r, { doorChance: 1, closedChance: 1 });
      return;
    }

    if (r.center.is(level.end)) {
      level.carveDoors(r);
      return;
    }

    level.carveDoors(r);
    if (!features.length) {
      return;
    }

    let feature = features.shift();
    if (feature == "typo") {
      let typo = new beings.Typo();
      typo.ai.hostile = false;
      typo.moveTo(r.center.clone(), level);
    } else if (feature == "coffee") {
      level.setItem(r.center.clone(), new items.Coffee());
    } else if (feature == "tool") {
      level.setItem(r.center.clone(), new items.PrintStatement());
    }
  });
}

// Every other layer: tangled code, doors, and two random features per room
// drawn from a weighted list.
function decorateFull(level) {
  decorateTangledCode(level);

  let features = {
    item: 4,
    drink: 3,
    allNighter: 0.1,
    gold: 2,
    enemy: 5,
    colleague: 1,
    empty: 2,
  };

  level.rooms.forEach((r) => {
    level.carveDoors(r);
    if (r.center.is(level.start) || r.center.is(level.end)) {
      return;
    }

    for (let i = 0; i < 2; i++) {
      let xy = new XY(
        RNG.getUniformInt(r.lt.x, r.rb.x),
        RNG.getUniformInt(r.lt.y, r.rb.y),
      );
      if (level.getEntity(xy) != cells.ROOM) {
        continue; // already occupied, or trimmed away
      }

      let feature = RNG.getWeightedValue(features);
      switch (feature) {
        case "item":
          level.setItem(xy, factory.getItem(level.danger));
          break;
        case "drink":
          level.setItem(xy, factory.getDrink());
          break;
        case "allNighter":
          level.setItem(xy, new items.AllNighter());
          break;
        case "gold":
          level.setItem(xy, new items.BugReport());
          break;
        case "enemy":
          factory.getBeing(level.danger).moveTo(xy, level);
          break;
        case "colleague":
          new beings.Colleague().moveTo(xy, level);
          break;
      }
    }
  });
}

function decorateRegular(level) {
  let r1 = room.furthestRoom(level.rooms, level.rooms[0]);
  let r2 = room.furthestRoom(level.rooms, r1);

  level.start = r1.center;
  level.end = r2.center;

  // Every regular floor has a staircase up at its far end.
  let up = new cells.Staircase(true, staircaseCallback(level.danger + 1, true));
  level.setCell(level.end, up);

  // And a staircase down at its start, once there is a floor below.
  if (level.danger - 1 in levels) {
    let down = new cells.Staircase(
      false,
      staircaseCallback(level.danger - 1, false),
    );
    level.setCell(level.start, down);
  }

  if (level.danger == 1) {
    decorateFirst(level);
  } else {
    decorateFull(level);
  }
}

export default function decorate(level) {
  levels[level.danger] = level;

  if (level.danger == rules.LAST_LEVEL) {
    decorateLast(level);
  } else {
    decorateRegular(level);
  }
}
