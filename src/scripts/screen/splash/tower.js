let element = document.createElement("div");

element.classList.add("tower");
element.innerHTML = "TOWER";

export function getContents() {
  return element;
}
