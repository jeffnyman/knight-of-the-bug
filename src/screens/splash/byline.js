let element = document.createElement("div");

element.classList.add("byline");
element.textContent = "by Jeff Nyman";

export function getContents() {
  return element;
}
