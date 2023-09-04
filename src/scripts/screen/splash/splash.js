import * as title from "./title.js";
import * as ground from "./ground.js";
import * as blurb from "./blurb.js";
import * as tower from "./tower.js";
import * as tidbit from "./tidbit.js";

function onResize() {
  ground.construct();
}

export function load(element) {
  console.log("Loading the splash screen...");

  element.appendChild(title.getContents());
  element.appendChild(ground.getContents());
  element.appendChild(blurb.getContents());
  element.appendChild(tower.getContents());
  element.appendChild(tidbit.getContents());

  ground.construct();

  window.addEventListener("resize", onResize);
}
