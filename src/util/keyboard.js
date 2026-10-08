import { DIRS } from "../conf.js";

// Keyboard input is routed to a stack of consumers. Whoever is on top of
// the stack (the splash screen, the player, a combat board, a menu) gets
// the key events; everything underneath waits its turn. Each consumer is
// an object with a handleKeyEvent(event) method.
const consumers = [];

// Each of these lists is ordered to match DIRS: NW, N, NE, E, SE, S, SW, W.
const DIR_KEYS = [
  "Home",
  "ArrowUp",
  "PageUp",
  "ArrowRight",
  "PageDown",
  "ArrowDown",
  "End",
  "ArrowLeft",
];

const DIR_NUMPAD = [
  "Numpad7",
  "Numpad8",
  "Numpad9",
  "Numpad6",
  "Numpad3",
  "Numpad2",
  "Numpad1",
  "Numpad4",
];

const DIR_VI = ["y", "k", "u", "l", "n", "j", "b", "h"];

export function getDirection(event) {
  let key = event.key || "";
  let index = DIR_NUMPAD.indexOf(event.code);

  if (index == -1) {
    index = DIR_KEYS.indexOf(key);
  }

  if (index == -1 && key.length == 1) {
    index = DIR_VI.indexOf(key.toLowerCase());
  }

  return index in DIRS ? DIRS[index] : null;
}

export function hasModifier(event) {
  return event.ctrlKey || event.shiftKey || event.altKey || event.metaKey;
}

export function isEnter(event) {
  return event.key == "Enter";
}

export function isSpace(event) {
  return event.key == " ";
}

export function isEscape(event) {
  return event.key == "Escape";
}

// Returns the digit 0-9 that was pressed, or null for any other key.
export function getNumber(event) {
  let key = event.key || "";

  if (!/^[0-9]$/.test(key)) {
    return null;
  }

  return Number(key);
}

export function push(consumer) {
  consumers.push(consumer);
}

export function pop() {
  consumers.pop();
}

// True for any key the game reacts to, with or without modifiers.
function isGameKey(event) {
  return (
    getDirection(event) !== null ||
    isEnter(event) ||
    isSpace(event) ||
    isEscape(event) ||
    getNumber(event) !== null
  );
}

export function dispatch(event) {
  let consumer = consumers[consumers.length - 1];

  if (!consumer) {
    return;
  }

  // Keep the browser out of it: arrows and Space would scroll the page,
  // and a modifier with an arrow navigates the browser's history.
  if (isGameKey(event) && typeof event.preventDefault == "function") {
    event.preventDefault();
  }

  consumer.handleKeyEvent(event);
}

if (typeof document != "undefined") {
  document.addEventListener("keydown", dispatch);
}
