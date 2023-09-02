let element = document.createElement("div");

element.classList.add("ground");
element.innerHTML = "GROUND";

const GROUND = "xxxxxxxxxx";

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

  finalView.push(grass);

  element.innerHTML = finalView.join("\n");
}

export function getContents() {
  return element;
}
