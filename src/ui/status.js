import { Color } from "rot-js";
import pc from "../being/pc.js";
import * as pubsub from "../util/pubsub.js";
import { COLORS, GLYPHS } from "../combat/types.js";

// The status panel: current layer, health, focus, bug reports and carried items.
// Redrawn whenever anything publishes "status-change".
let node = null;

export function init(element) {
  node = element;
  node.classList.remove("hidden");
  pubsub.subscribe("status-change", update);
}

export function update() {
  if (!node) {
    return;
  }

  let text = "";
  let level = pc.getLevel();
  if (level) {
    text = `Layer ${level.danger}. `;
  }
  node.innerHTML = `${text}You have:`;

  let list = document.createElement("ul");
  node.appendChild(list);

  list.appendChild(buildStatus());
  list.appendChild(buildItems());
}

function buildStatus() {
  let item = document.createElement("li");

  let hp = buildPercentage(pc.hp, pc.maxhp);
  let mana = buildPercentage(pc.mana, pc.maxmana);
  let text = `${hp} health, ${mana} focus`;

  let gold = pc.inventory.getItemByType("report");
  let coins = gold ? gold.amount : 0;
  if (coins > 0) {
    let color = gold.getVisual().fg;
    let suffix = coins > 1 ? "s" : "";
    text = `${text}, <span style="color:${color}">${coins}</span> ${gold}${suffix}`;
  }

  item.innerHTML = text;
  return item;
}

// "12/20" with the current value coloured from red (empty) to green (full).
function buildPercentage(value, limit) {
  let fraction = limit ? value / limit : 0;
  let color = Color.interpolateHSL([255, 0, 0], [0, 255, 0], fraction);
  color = Color.toRGB(color);
  return `<span style="color:${color}">${value}</span>/${limit}`;
}

function buildItems() {
  let fragment = document.createDocumentFragment();
  let items = pc.inventory.getItems().filter((i) => i.getType() != "report");

  items.forEach((item) => {
    let node = document.createElement("li");
    let text = item.toString();
    if (item.modifier) {
      text = `${text} (${item.modifier > 0 ? "+" : ""}${item.modifier})`;
    }
    if (item.combat) {
      text = `${text} (+<strong style="color:${COLORS[item.combat]}">${GLYPHS[item.combat]}</strong>)`;
    }
    node.innerHTML = text;
    fragment.appendChild(node);
  });

  return fragment;
}
