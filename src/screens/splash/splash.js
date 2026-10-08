import * as keyboard from "../../util/keyboard.js";
import * as title from "./title.js";
import * as byline from "./byline.js";
import * as ground from "./ground.js";
import * as blurb from "./blurb.js";
import * as tower from "./tower.js";
import * as tidbit from "./tidbit.js";

let container = null;
let resolve = null;

function onResize() {
  tower.construct();
  ground.construct();
}

function handleKeyEvent(event) {
  if (!keyboard.isEnter(event)) {
    return;
  }

  keyboard.pop();
  window.removeEventListener("resize", onResize);
  container.replaceChildren();

  resolve();
}

// Shows the splash screen inside the given element and returns a promise
// that resolves, with the splash removed, once the player presses Enter.
export function load(element) {
  console.log("Loading the splash screen...");

  container = element;

  container.appendChild(title.getContents());
  container.appendChild(byline.getContents());
  container.appendChild(ground.getContents());
  container.appendChild(blurb.getContents());
  container.appendChild(tower.getContents());
  container.appendChild(tidbit.getContents());

  tower.construct();
  ground.construct();

  keyboard.push({ handleKeyEvent });
  window.addEventListener("resize", onResize);

  return new Promise((r) => (resolve = r));
}
