import * as combat from "../../combat/combat.js";
import * as map from "../../ui/map/map.js";
import * as log from "../../ui/log.js";
import * as status from "../../ui/status.js";
import * as actors from "../../util/actors.js";
import pc from "../../being/pc.js";
import { generate } from "../../level/generator.js";
import { getLevels } from "../../level/decorator.js";
import { RNG } from "rot-js";
import { seedQuery } from "../../util/seed.js";
import { enabledBugs } from "../../util/bugs.js";

// Builds the four game panels inside the container and starts play on
// the first layer. The seed is applied again here, because the splash
// screen draws random numbers too and how many depends on the window
// size; re-seeding keeps the tower identical for a given seed.
const PANELS = ["map", "combat", "log", "status"];

function buildPanels(container) {
  let panels = {};

  PANELS.forEach((name) => {
    let panel = document.createElement("div");
    panel.id = name;
    panel.classList.add("panel", name, "hidden");
    container.appendChild(panel);
    panels[name] = panel;
  });

  return panels;
}

export function start(container, seed) {
  console.log("Starting the game...");

  if (seed !== undefined) {
    RNG.setSeed(seed);
  }

  let panels = buildPanels(container);

  map.init(panels.map);
  combat.init(panels.combat);
  log.init(panels.log);
  status.init(panels.status);

  status.update();

  log.add("A truly beautiful day for a bug hunt!");
  log.add(
    "This tower of code is surrounded by plains and trees, and somewhere on its top layer a core feature lies dormant.",
  );
  log.pause();
  log.add(
    "Apparently the only way to reach it is to work your way up through every layer.",
  );
  log.add(
    "To move around, use {#fff}arrow keys{}, {#fff}numpad{} or {#fff}vi-keys{}. Press {#fff}Space{} to wait a turn.",
  );
  log.pause();

  if (seed !== undefined) {
    log.add(
      `This hunt's seed is {#fff}${seed}{}. Add {#fff}${seedQuery(seed)}{} to the address to replay it.`,
    );
    log.pause();
  }

  let seeded = enabledBugs().length;
  if (seeded > 0) {
    log.add(
      `{#f00}Bug hunt mode:{} this build has ${seeded} deliberately seeded ${seeded == 1 ? "bug" : "bugs"}. Happy hunting!`,
    );
    log.pause();
  }

  let level = generate(1);
  level.activate(level.start, pc);

  actors.loop();

  // In development, expose the game's innards on the console for poking
  // at state and reproducing bugs. Not present in production builds.
  if (import.meta.env.DEV) {
    window.kotb = { pc, actors, combat, log, seed, levels: getLevels() };
  }
}
