import { RNG } from "rot-js";
import * as items from "../item/items.js";
import * as beings from "../being/beings.js";

// Picks a class whose danger rating best fits the requested danger. The
// rating is sampled from a normal distribution around the request, so a
// floor mostly produces things of its own level with the odd easier or
// slightly harder surprise. Anything much too hard is replaced by
// something uniformly easier.
function pick(classes, danger) {
  let d = RNG.getNormal(danger, 1);
  d = Math.max(1, d);

  if (d > danger + 1) {
    d = RNG.getUniformInt(1, danger);
  }

  let available = Object.values(classes).filter((c) => "danger" in c);

  let best = [];
  let bestDistance = Infinity;
  available.forEach((c) => {
    let distance = Math.abs(c.danger - d);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = [];
    }
    if (distance == bestDistance) {
      best.push(c);
    }
  });

  let Ctor = RNG.getItem(best);
  return new Ctor();
}

export function getItem(danger) {
  return pick(items, danger);
}

export function getBeing(danger) {
  return pick(beings, danger);
}

export function getDrink() {
  let Ctor = RNG.getItem([items.Coffee, items.EnergyDrink]);
  return new Ctor();
}
