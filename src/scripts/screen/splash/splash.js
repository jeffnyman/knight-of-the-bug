import * as title from "./title.js";

export function load(element) {
  console.log("Loading the splash screen...");

  element.appendChild(title.getContents());
}
