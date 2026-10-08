import "./styles/app.css";

import { RNG } from "rot-js";
import * as splash from "./screens/splash/splash.js";
import * as game from "./screens/game/game.js";
import { resolveSeed, seedQuery } from "./util/seed.js";
import { enable, resolveBugs } from "./util/bugs.js";

// Everything random in the game flows from this seed. Add ?seed=<number>
// to the URL to replay a run; the seed is logged so it can be copied.
let seed = resolveSeed(window.location.search);
console.log(`seed ${seed} (replay with ${seedQuery(seed)})`);
RNG.setSeed(seed);

// Deliberately seeded bugs, for the exercise: ?bugs=all or ?bugs=id,id.
let bugs = resolveBugs(window.location.search);
enable(bugs);
if (bugs.length) {
  console.log(`seeded bugs: ${bugs.join(", ")}`);
}

console.log("App Started");

let app = document.getElementById("app");

splash.load(app).then(() => game.start(app, seed));
