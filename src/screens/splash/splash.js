import * as keyboard from "../../util/keyboard.js";
import * as title from "./title.js";
import * as byline from "./byline.js";
import * as ground from "./ground.js";
import * as blurb from "./blurb.js";
import * as tower from "./tower.js";
import * as tidbit from "./tidbit.js";

let container = null;
let resolve = null;
let active = false;

function onResize() {
  tower.construct();
  ground.construct();
}

// The ground and tower size themselves by measuring rendered text, so
// they need the game font. On a cold load that font is still downloading
// when the splash first renders, and measuring with the fallback font
// gives a wrong column count: once Metrickal swaps in, the ground row
// overflows the viewport and the knight is pushed off the left edge. A
// refresh hides the problem because the font is then cached. So ask the
// browser for the font and rebuild once it has arrived.
function rebuildWhenFontLoads() {
  if (!document.fonts || !document.fonts.load) {
    return;
  }

  document.fonts
    .load("1em Metrickal")
    .then(() => {
      if (active) {
        onResize();
      }
    })
    .catch(() => {});
}

function handleKeyEvent(event) {
  if (!keyboard.isEnter(event)) {
    return;
  }

  active = false;
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
  active = true;

  container.appendChild(title.getContents());
  container.appendChild(byline.getContents());
  container.appendChild(ground.getContents());
  container.appendChild(blurb.getContents());
  container.appendChild(tower.getContents());
  container.appendChild(tidbit.getContents());

  tower.construct();
  ground.construct();
  rebuildWhenFontLoads();

  keyboard.push({ handleKeyEvent });
  window.addEventListener("resize", onResize);

  return new Promise((r) => (resolve = r));
}
