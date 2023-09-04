let element = document.createElement("div");

element.classList.add("tidbit");

const TIDBITS = [
  "This game is based on \"Sleeping Beauty\" by Ondřej Žára.",
  "This game is best played with a maximized browser window.",
];

function get_random(list) {
  return list[Math.floor(Math.random() * list.length)];
}

element.innerHTML = `${get_random(TIDBITS)}`;

export function getContents() {
  return element;
}
