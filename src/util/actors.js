// The turn scheduler. Every being that can act is an actor in a round
// robin queue. Each actor's act() returns a promise; the next actor only
// takes its turn once that promise settles. The player's promise stays
// pending until a key is pressed, which is what makes the game turn based.
let queue = [];

export function add(actor) {
  queue.push(actor);
}

export function clear() {
  queue = [];
}

export function remove(actor) {
  let index = queue.indexOf(actor);

  if (index > -1) {
    queue.splice(index, 1);
  }
}

export function getQueue() {
  return queue.slice();
}

export function loop() {
  if (!queue.length) {
    return; // endgame
  }

  let actor = queue.shift();
  queue.push(actor);
  actor.act().then(loop);
}
