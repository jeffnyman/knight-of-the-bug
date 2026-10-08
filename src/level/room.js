import { RNG } from "rot-js";
import XY from "../util/xy.js";

// Rooms are plain objects: { lt, rb, center, neighbors } where lt and rb
// are the inclusive left-top and right-bottom corners.

// How far from an existing room's centre a new room's centre may land.
const DIST = 10;

// Rooms have even widths and heights so that a centre cell exists.
function roomSize() {
  let w = 2 * RNG.getUniformInt(2, 5);
  let h = w + 2 * RNG.getUniformInt(-1, 1);
  return new XY(w, h);
}

function cloneRoom(room) {
  return {
    neighbors: room.neighbors.slice(),
    lt: room.lt.clone(),
    rb: room.rb.clone(),
    center: room.center.clone(),
  };
}

export function centerRoom(halfSize) {
  return {
    neighbors: [],
    center: new XY(0, 0),
    lt: halfSize.scale(-1),
    rb: halfSize.scale(1),
  };
}

export function roomNearTo(xy) {
  let cx = xy.x + RNG.getUniformInt(-DIST, DIST);
  let cy = xy.y + RNG.getUniformInt(-DIST, DIST);
  let center = new XY(cx, cy);

  let size = roomSize();

  return {
    neighbors: [],
    center,
    lt: center.minus(size.scale(0.5)),
    rb: center.plus(size.scale(0.5)),
  };
}

export function enlarge(room, diff) {
  let clone = cloneRoom(room);
  clone.lt.x -= diff;
  clone.lt.y -= diff;
  clone.rb.x += diff;
  clone.rb.y += diff;
  return clone;
}

// The room furthest from `start` by number of connections, not by
// distance on the map. Used to put the staircases far apart.
export function furthestRoom(rooms, start) {
  let bestDistance = 0;
  let bestRoom = null;

  let visited = [];

  function visit(room, distance) {
    visited.push(room);

    if (distance > bestDistance) {
      bestDistance = distance;
      bestRoom = room;
    }

    room.neighbors
      .filter((r) => !visited.includes(r))
      .forEach((r) => visit(r, distance + 1));
  }

  visit(start, 0);
  return bestRoom || start;
}
