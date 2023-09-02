let element = document.createElement("div");

element.classList.add("ground");
element.innerHTML = "GROUND";

const GROUND = "xxxxxxxxxx";
const SPACING = "  ";

const KNIGHT = [
  "   .-.   ",
  " __|=|__ ",
  "(_/'-'\\_)",
  "//\\___/\\\\",
  "<>/   \\<>",
  " \\|_._|/ ",
  "  <_I_>  ",
  "   |||   ",
  "  /_|_\\  ",
];

const FLOWER = [
  "     ",
  "     ",
  "     ",
  "     ",
  "     ",
  " .:. ",
  "-=o=-",
  " ':' ",
  " \\|/ ",
];

function applyKnightColors(character) {
  let color = "#aae";
  return `<span style="color:${color}">${character}</span>`;
}

function applyFlowerColors(character) {
  let color = "#f00";

  if (character == "o") {
    color = "#ff0";
  }

  if (character == "\\" || character == "/" || character == "|") {
    color = "lime";
  }

  character = character.replace(/</, "&lt;").replace(/>/, "&gt;");

  return `<span style="color:${color}">${character}</span>`;
}

export function construct() {
  let finalView = [];

  element.innerHTML = GROUND;

  // The following code is a way to determine the number of columns needed
  // to make the visual representation of the ground fit nicely within the
  // available space. By adjusting the number of columns based on the
  // available width, the code ensures that the ground representation is
  // responsive to the size of the container and doesn't exceed it. This
  // makes the grass representation adapt to different container widths
  // while maintaining its visual integrity.
  let pixels = element.parentNode.offsetWidth;
  let columns = Math.floor((GROUND.length * pixels) / element.offsetWidth) - 2;
  let grass = `<span class='grass'>${new Array(columns + 1).join("^")}</span>`;

  // The following code takes the original ASCII art representation of the
  // knight and adds `<span>` elements to color each character as specified
  // by the applyKnightColors function. The resulting knight array contains
  // the modified ASCII art that can be rendered, displaying the knight with
  // the specified color. The same applies to the flower.
  let knight = KNIGHT.join("\n").replace(/\S/g, applyKnightColors).split("\n");
  let flower = FLOWER.join("\n").replace(/\S/g, applyFlowerColors).split("\n");

  for (let i = 0; i < knight.length; i++) {
    let object_columns = columns;

    object_columns -= SPACING.length;
    object_columns -= knight.length;
    object_columns -= flower.length - 4;

    let row = `${SPACING}${knight[i]}${new Array(object_columns + 1).join(
      " ",
    )}${flower[i]}`;

    finalView.push(row);
  }

  finalView.push(grass);

  element.innerHTML = finalView.join("\n");
}

export function getContents() {
  return element;
}
