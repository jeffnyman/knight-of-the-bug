import * as title from "./title.js";
import * as ground from "./ground.js";

function onResize() {
  ground.construct();
}

export function load(element) {
  console.log("Loading the splash screen...");

  element.appendChild(title.getContents());
  element.appendChild(ground.getContents());

  ground.construct();

  window.addEventListener("resize", onResize);
}
