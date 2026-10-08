import { RNG } from "rot-js";
import XY from "../util/xy.js";
import Level, { dangerToRadius } from "./level.js";
import decorate from "./decorator.js";
import * as room from "./room.js";
import * as rules from "../rules.js";

// Builds the layout of a floor: rooms placed near one another and joined
// by corridors, then handed to the decorator to be furnished.

function connectHorizontal(level, room1, room2) {
  let min = Math.max(room1.lt.x, room2.lt.x);
  let max = Math.min(room1.rb.x, room2.rb.x);
  let x = RNG.getUniformInt(min, max);
  level.carveCorridor(new XY(x, room1.center.y), new XY(x, room2.center.y));
}

function connectVertical(level, room1, room2) {
  let min = Math.max(room1.lt.y, room2.lt.y);
  let max = Math.min(room1.rb.y, room2.rb.y);
  let y = RNG.getUniformInt(min, max);
  level.carveCorridor(new XY(room1.center.x, y), new XY(room2.center.x, y));
}

// Two rooms that overlap in neither axis are joined by an L-shaped
// corridor whose corner is the one nearer the floor's centre.
function connectL(level, room1, room2) {
  let p1 = new XY(room1.center.x, room2.center.y);
  let p2 = new XY(room2.center.x, room1.center.y);
  let corner = p1.norm() < p2.norm() ? p1 : p2;

  level.carveCorridor(room1.center, corner);
  level.carveCorridor(room2.center, corner);
}

function connect(level, room1, room2) {
  room1.neighbors.push(room2);
  room2.neighbors.push(room1);

  let overlapHorizontal = !(room1.lt.x > room2.rb.x || room2.lt.x > room1.rb.x);
  let overlapVertical = !(room1.lt.y > room2.rb.y || room2.lt.y > room1.rb.y);

  if (overlapHorizontal) {
    connectHorizontal(level, room1, room2);
  } else if (overlapVertical) {
    connectVertical(level, room1, room2);
  } else {
    connectL(level, room1, room2);
  }
}

// Tries to place one more room near a random existing room, giving up
// after many failed attempts. Returns whether a room was added.
function generateNextRoom(level) {
  let center = new XY(0, 0);
  let failed = -1;

  while (failed < 1000) {
    failed++;
    let oldRoom = null;
    if (level.rooms.length > 0) {
      oldRoom = RNG.getItem(level.rooms);
      center = oldRoom.center;
    }

    let newRoom = room.roomNearTo(center);
    if (!level.isInside(newRoom.center)) {
      continue;
    }
    if (!level.fits(room.enlarge(newRoom, 2))) {
      continue;
    }

    level.carveRoom(newRoom);

    if (oldRoom) {
      connect(level, oldRoom, newRoom);
    }

    return true;
  }

  return false;
}

// Adds a corridor from a room to the nearest room it is not already
// joined to, so the two ends of the floor get a shortcut or a loop.
function connectWithClosest(target, level) {
  let byDistance = (r1, r2) =>
    r1.center.minus(target.center).norm() - r2.center.minus(target.center).norm();

  let available = level.rooms.filter(
    (r) => !r.neighbors.includes(target) && r != target,
  );
  available.sort(byDistance);

  if (!available.length) {
    return;
  }

  connect(level, target, available[0]);
}

export function generate(danger) {
  let level = new Level(danger);

  if (danger == rules.LAST_LEVEL) {
    let radius = dangerToRadius(danger);
    let centerRoom = room.centerRoom(new XY(radius, radius));
    level.carveRoom(centerRoom);
  } else {
    while (generateNextRoom(level)) {
      // keep adding rooms until no more fit
    }
    let r1 = room.furthestRoom(level.rooms, level.rooms[0]);
    let r2 = room.furthestRoom(level.rooms, r1);
    connectWithClosest(r1, level);
    connectWithClosest(r2, level);
  }

  level.trim();
  decorate(level);

  return level;
}
