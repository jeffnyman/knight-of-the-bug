import * as log from "./log.js";
import * as keyboard from "../util/keyboard.js";

// A numbered menu in the log. Resolves with the chosen option's index, or
// -1 when the player presses 0 or Escape.
let resolve = null;
let count = 0;

const SPACE = String.fromCharCode(160, 160);

function end(value) {
  keyboard.pop();
  resolve(value);
}

function handleKeyEvent(event) {
  if (keyboard.isEscape(event)) {
    return end(-1);
  }

  let number = keyboard.getNumber(event);
  if (number === null) {
    return;
  }

  if (number >= 0 && number <= count) {
    end(number - 1);
  }
}

export default function choice(options) {
  count = options.length;

  options.forEach((option, index) => {
    log.add(`\n${SPACE}{#fff}${index + 1}{} ${option}`);
  });
  log.add(`\n${SPACE}{#fff}0{} or {#fff}Escape{} to abort`);
  log.pause();

  keyboard.push({ handleKeyEvent });
  return new Promise((r) => (resolve = r));
}
