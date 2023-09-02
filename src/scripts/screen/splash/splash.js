import * as title from "./title.js";
import * as ground from "./ground.js";

export function load(element) {
  console.log("Loading the splash screen...");

  element.appendChild(title.getContents());
  element.appendChild(ground.getContents());
}
