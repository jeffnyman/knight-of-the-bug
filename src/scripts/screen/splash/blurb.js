let element = document.createElement("div");

element.classList.add("blurb");
element.innerHTML = `Into the heights did the bug go, surrounded by dense
code, hidden by layers of abstraction. Many tester knights tried to find
and combat the bug ... and yet it persists.
<br/><br/><span>Press [Enter] to start the hunt</span>`;

export function getContents() {
  return element;
}
