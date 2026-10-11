// Deliberately seeded bugs for the bug-hunting exercise. None are active
// unless the page is loaded with ?bugs=<id,id,...> or ?bugs=all. Each
// injection point in the code asks hasBug("id") and misbehaves when it is
// on. The catalogue below is the single list of what exists; the answer
// key describing each one lives in docs/answer-key.md.

// What each one breaks. This stays a comment on purpose: minification
// strips it, so the descriptions do not ship in the bundle the class
// plays, while whoever maintains this still has them to hand.
//
//   an-article       the indefinite article is wrong for some words
//   board-edge       the combat cursor can leave the board at two of its edges
//   health-overflow  healing is not capped at maximum health
//   loot-lost        beings carrying a single item drop nothing when crushed
//   door-blind       opening a door does not reveal what is behind it
//   layer-label      the welcome message names the wrong layer
//   defense-ignored  carried defensive items do not reduce damage
//   weak-is-strong   weak drinks are as strong as strong ones
export const CATALOGUE = [
  "an-article",
  "board-edge",
  "health-overflow",
  "loot-lost",
  "door-blind",
  "layer-label",
  "defense-ignored",
  "weak-is-strong",
];

const PARAMETER = "bugs";

let enabled = new Set();

export function isKnown(id) {
  return CATALOGUE.includes(id);
}

export function enable(ids) {
  ids.forEach((id) => {
    if (!isKnown(id)) {
      throw new Error(`unknown seeded bug: ${id}`);
    }
    enabled.add(id);
  });
}

export function reset() {
  enabled = new Set();
}

export function enabledBugs() {
  return CATALOGUE.filter((id) => enabled.has(id));
}

export function hasBug(id) {
  if (!isKnown(id)) {
    throw new Error(`unknown seeded bug: ${id}`);
  }
  return enabled.has(id);
}

// Parses ?bugs=... from a query string into a list of known ids. "all"
// selects every bug; unknown ids are dropped so a typo cannot break the
// page.
export function resolveBugs(search) {
  let value = new URLSearchParams(search).get(PARAMETER);
  if (value === null) {
    return [];
  }

  let ids = value
    .split(",")
    .map((id) => id.trim())
    .filter((id) => id.length > 0);

  if (ids.includes("all")) {
    return [...CATALOGUE];
  }

  return CATALOGUE.filter((id) => ids.includes(id));
}
