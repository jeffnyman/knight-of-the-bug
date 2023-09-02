let element = document.createElement("div");

element.classList.add("ground");
element.innerHTML = "GROUND";

export function getContents() {
  return element;
}
