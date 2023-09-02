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

function applyKnightColors(character) {
  let color = "#aae";
  return `<span style="color:${color}">${character}</span>`;
}

export function construct() {
  let finalView = [];

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
  // the specified color.
  let knight = KNIGHT.join("\n").replace(/\S/g, applyKnightColors).split("\n");

  for (let i = 0; i < knight.length; i++) {
    let object_columns = columns;

    object_columns -= SPACING.length;
    object_columns -= knight.length;

    let row = `${SPACING}${knight[i]}${new Array(object_columns + 1).join(
      " ",
    )}${knight[i]}`;

    finalView.push(row);
  }

  finalView.push(grass);

  element.innerHTML = finalView.join("\n");
}

export function getContents() {
  return element;
}
