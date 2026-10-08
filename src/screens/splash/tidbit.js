let element = document.createElement("div");

element.classList.add("tidbit");

const TIDBITS = [
  "This game is based on \"Sleeping Beauty\" by Ondřej Žára.",
  "This game is best played with a maximized browser window.",
  "The tower is procedurally generated. Try resizing this page!",
  "You can reload this page to get another tidbit.",
  "This game is written with rot.js, the JavaScript Roguelike Toolkit.",
  "This game can be won!",
  "This game can be lost!",
  "This game features permadeath and procedural generation.",
  "This game uses the 'Metrickal' font face.",
  "Pulling an all-nighter might be dangerous.",
  "Every bug you squash was somebody's feature once.",
];

function get_random(list) {
  return list[Math.floor(Math.random() * list.length)];
}

element.innerHTML = `${get_random(TIDBITS)}`;

export function getContents() {
  return element;
}
