// Every random decision in the game flows from one seed, so a run can be
// replayed exactly by starting with the same one. The seed comes from the
// page URL (?seed=12345) when given, otherwise from the clock.

const PARAMETER = "seed";

// Parses the seed out of a query string such as "?seed=42". Anything that
// is not a plain integer is ignored and the fallback is used instead.
export function resolveSeed(search, fallback = Date.now()) {
  let value = new URLSearchParams(search).get(PARAMETER);

  if (value === null || !/^-?\d+$/.test(value.trim())) {
    return fallback;
  }

  let seed = Number(value);
  if (!Number.isSafeInteger(seed)) {
    return fallback;
  }

  return seed;
}

// The query string that replays a run with the given seed.
export function seedQuery(seed) {
  return `?${PARAMETER}=${seed}`;
}
