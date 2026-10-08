import { RNG } from "rot-js";

let element = document.createElement("div");

element.classList.add("tower");

const TOP = [
  " _     _     _     _ ",
  "[_]___[_]___[_]___[_]",
  "[__#__][__#I_]__I__#]",
  "[_I_#_I__*[__]__#_*_]",
  "   [_]_#_]__I_#__]   ",
  "   [I_|/     \\|*_]   ",
  "   [#_||  ?  ||_#]   ",
  "   [_I||     ||_#]   ",
  "   [__]|     ||#_]   ",
];

const BOTTOM = [" \\\\[__]#_I__][__#]// "];

const WIDTH = 13;

// Ten blank lines, used to measure how tall a line of text is so we can
// work out how many tower rows fit in the available vertical space.
const PROBE = new Array(11).join("\n");

// Builds one randomly generated row of the tower's middle section. Bricks
// are separated by "I", "]" or "[" and overgrown here and there with vines
// ("#") and flowers ("*"). The further we get from the last separator or
// vine, the more likely the next one becomes.
export function buildMiddleRow() {
  let content = "";
  let separatorDistance = 0;
  let vineDistance = 0;

  for (let i = 0; i < WIDTH; i++) {
    let character = "";
    let separatorChance = (separatorDistance - 0.5) / 3;
    let vineChance = (vineDistance + 1) / 15;

    if (RNG.getUniform() < separatorChance) {
      character = RNG.getItem(["I", "]", "["]);
      separatorDistance = 0;
    } else {
      separatorDistance++;
      character = "_";
    }

    if (RNG.getUniform() < vineChance) {
      character = RNG.getItem(["#", "#", "*"]);
      vineDistance = 0;
    } else {
      vineDistance++;
    }

    content += character;
  }

  return `   [${content}]   `;
}

// Assembles the full tower as an array of plain-text rows: the fixed top,
// the requested number of generated middle rows, and the fixed bottom.
export function buildTowerRows(middleRows) {
  let rows = TOP.slice();

  for (let i = 0; i < middleRows; i++) {
    rows.push(buildMiddleRow());
  }

  return rows.concat(BOTTOM);
}

function applyTowerColors(character, index, text) {
  let color = RNG.getItem(["#888", "#aaa", "#999"]);
  let transparent = false;

  switch (character) {
    case "?":
      color = "red";
      transparent = true;
      break;
    case "/":
    case "\\":
      if (
        text.charAt(index - 1) == character ||
        text.charAt(index + 1) == character
      ) {
        color = "lime";
        transparent = true;
      }
      break;
    case "#":
      color = RNG.getItem(["#383", "#262"]);
      break;
    case "*":
      color = "pink";
      break;
  }

  if (character == "_" && text.charAt(index - 1) == " ") {
    transparent = true;
  }

  let className = transparent ? " class='transparent'" : "";

  return `<span style="color:${color}"${className}>${character}</span>`;
}

export function construct() {
  // Measure the height of ten lines to learn how many rows of text fit in
  // the parent, then leave a little headroom so the tower never collides
  // with the title at the top of the screen.
  let pixels = element.parentNode.offsetHeight;
  element.innerHTML = PROBE;
  let rows = Math.floor((PROBE.length * pixels) / element.offsetHeight) - 4;

  rows -= TOP.length;
  rows -= BOTTOM.length;

  let tower = buildTowerRows(Math.max(rows, 0));

  element.innerHTML = tower.join("\n").replace(/\S/g, applyTowerColors);
}

export function getContents() {
  return element;
}
