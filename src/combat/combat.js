import Board from "./board.js";
import XY from "../util/xy.js";
import * as ui from "../ui/combat.js";
import * as keyboard from "../util/keyboard.js";
import * as map from "../ui/map/map.js";
import * as log from "../ui/log.js";
import pc from "../being/pc.js";
import { format } from "../util/format.js";
import { ATTACK_2, MAGIC_1, MAGIC_2 } from "./types.js";
import { hasBug } from "../util/bugs.js";

// Combat is a "Debug Session": the player moves a cursor over the
// board and presses Enter on a group of two or more same-kind blocks.
// The group vanishes, blocks fall to fill the gap, and the group's kind
// decides who hits whom, with the group's size as the power of the blow.
// Combat ends when either side runs out of health.

// Indexed by how much health the defender has left, as a fraction.
const AMOUNTS = ["critically", "severely", "moderately", "slightly"];

let tutorial = false;

let board = null;
let resolve = null;
let enemy = null;
let cursor = new XY(0, 0);

function end() {
  map.activate();
  map.zoomOut();
  ui.deactivate();
  keyboard.pop();
  resolve();
}

function doDamage(attacker, defender, options = {}) {
  if (options.isMagic) {
    if (attacker.mana < options.power) {
      log.add(
        "%The %{verb,do} not have enough focus to attack.",
        attacker,
        attacker,
      );
      return;
    }
    attacker.adjustStat("mana", -options.power);
  }

  let attack = attacker.getAttack();
  let defense = defender.getDefense();
  let damage = Math.max(1, attack + options.power - defense);

  let verb = format(
    options.isMagic ? "%{verb,cast} a hotfix at %the" : "%{verb,strike} at %the",
    attacker,
    defender,
  );

  let newHP = Math.max(0, defender.hp - damage);
  if (newHP > 0) {
    let fraction = newHP / defender.maxhp;
    let amount = AMOUNTS[Math.floor(fraction * AMOUNTS.length)];
    log.add(
      `%The ${verb} and ${amount} %{verb,weaken} %it.`,
      attacker,
      attacker,
      defender,
    );
  } else {
    log.add(`%The ${verb} and %{verb,crush} %it!`, attacker, attacker, defender);
  }

  defender.adjustStat("hp", -damage);
  if (defender.hp <= 0) {
    end();
  }
}

// Enter on the cursor: play the segment there, if it is big enough.
function activate(xy) {
  let segment = board.findSegment(xy);
  if (!segment || segment.length < 2) {
    return;
  }

  let value = board.at(xy).value;

  segment.forEach((sxy) => board.set(sxy, null));

  let animation = board.fall();
  animation.start(drawFast).then(() => {
    checkSegments();
    drawFull();
  });

  let power = segment.length;
  let isMagic = value == MAGIC_1 || value == MAGIC_2;
  let attacker = pc;
  let defender = enemy;
  if (value == ATTACK_2 || value == MAGIC_2) {
    attacker = enemy;
    defender = pc;
  }

  doDamage(attacker, defender, { power, isMagic });
}

// Reshuffles the board until there is at least one playable segment.
function checkSegments() {
  while (board.getAllSegments()[0].length < 2) {
    board.randomize();
  }
}

function handleKeyEvent(event) {
  if (keyboard.isEnter(event)) {
    return activate(cursor);
  }

  let direction = keyboard.getDirection(event);
  if (!direction) {
    return;
  }

  // Screen directions have y growing downwards; the board's y grows up.
  direction = direction.scale(1, -1);
  let size = board.getSize();
  let next = cursor.plus(direction);
  if (hasBug("board-edge")) {
    cursor = new XY(next.x % size.x, next.y % size.y);
  } else {
    cursor = next.mod(size);
  }
  drawFull();
}

function drawFast() {
  ui.draw(board, cursor);
}

function drawFull() {
  let highlight = board.findSegment(cursor);
  if (highlight && highlight.length < 2) {
    highlight = null;
  }
  ui.draw(board, cursor, highlight || []);
}

export function init(parent) {
  ui.init(parent);
  board = new Board().randomize();
  checkSegments();
  drawFull();
}

// Starts a fight with the given being. Resolves when the fight is over.
export function start(e) {
  map.deactivate();
  map.zoomIn();
  ui.activate();

  if (!tutorial) {
    tutorial = true;
    log.add(
      "Combat in Knight of the Bug happens by running a {goldenrod}Debug Session{} on a square game board.",
    );
    log.add(
      "Match groups ({#fff}direction keys{} and {#fff}Enter{}) of matching symbols to perform individual actions. This includes both your attacks as well as your enemy's.",
    );
    log.add(
      "Note that certain items in your inventory can modify how often each symbol appears on the game board.",
    );
    log.pause();
  }

  enemy = e;
  let promise = new Promise((r) => (resolve = r));
  keyboard.push({ handleKeyEvent });

  return promise;
}

// For tests and debugging.
export function getBoard() {
  return board;
}

export function getCursor() {
  return cursor;
}
