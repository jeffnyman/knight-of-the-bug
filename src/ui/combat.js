import XY from "../util/xy.js";
import {
  ATTACK_1,
  ATTACK_2,
  MAGIC_1,
  MAGIC_2,
  COLORS,
  GLYPHS,
} from "../combat/types.js";

// The combat panel: a heading, a canvas showing the board as coloured
// glyphs with a cursor, and a legend saying what each glyph does.
const CELL = 30;

const LABELS = {
  [ATTACK_1]: "You patch",
  [ATTACK_2]: "Bug strikes",
  [MAGIC_1]: "You refactor (focus)",
  [MAGIC_2]: "Bug corrupts (focus)",
};

let ctx = null;
let legend = null;

function buildLegend() {
  [ATTACK_1, ATTACK_2, MAGIC_1, MAGIC_2].forEach((id) => {
    let item = document.createElement("li");
    legend.appendChild(item);
    item.setAttribute("data-id", id);

    let glyph = document.createElement("span");
    glyph.style.color = COLORS[id];
    glyph.innerHTML = `${GLYPHS[id]} `;
    item.appendChild(glyph);
    item.appendChild(document.createTextNode(LABELS[id]));
  });
}

// Dims every legend entry except the one for the given block kind.
function updateLegend(id) {
  Array.from(legend.querySelectorAll("[data-id]")).forEach((item) => {
    item.classList.toggle("inactive", item.getAttribute("data-id") != id);
  });
}

function drawCell(xy, glyph, color, highlight) {
  let x = (xy.x + 0.5) * CELL;
  let y = ctx.canvas.height - (xy.y + 0.5) * CELL; // board y grows upwards

  let alpha = 0.8;
  let bold = false;
  if (highlight.some((hxy) => hxy.is(xy))) {
    alpha = 1;
    bold = true;
  }

  ctx.font = `${bold ? "bold " : ""}${CELL * 0.8}px metrickal, monospace`;
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.fillText(glyph, x, y);
}

function drawCursor(xy) {
  ctx.strokeStyle = "#999";
  ctx.lineWidth = 2;

  let x = xy.x * CELL;
  let y = ctx.canvas.height - (xy.y + 1) * CELL;
  ctx.strokeRect(x + 2, y + 2, CELL - 4, CELL - 4);
}

// Redraws the whole board. Blocks in `highlight` (the segment under the
// cursor) are drawn bold and opaque, and the legend points at their kind.
export function draw(board, cursor, highlight = []) {
  if (!ctx) {
    return;
  }

  let size = board.getSize();
  ctx.canvas.width = size.x * CELL;
  ctx.canvas.height = size.y * CELL;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  let xy = new XY();
  for (xy.x = 0; xy.x < size.x; xy.x++) {
    for (xy.y = 0; xy.y < size.y; xy.y++) {
      let cell = board.at(xy);
      if (!cell) {
        return;
      }
      let position = cell.animated || xy;
      drawCell(position, GLYPHS[cell.value], COLORS[cell.value], highlight);
    }
  }

  drawCursor(cursor);
  updateLegend(highlight.length > 0 ? board.at(cursor).value : null);
}

export function init(parent) {
  ctx = document.createElement("canvas").getContext("2d");
  legend = document.createElement("ul");

  let heading = document.createElement("p");
  heading.innerHTML = "Debug Session";
  parent.appendChild(heading);
  parent.appendChild(ctx.canvas);
  buildLegend();
  parent.appendChild(legend);
}

export function activate() {
  if (!ctx) {
    return;
  }
  let node = ctx.canvas.parentNode;
  node.classList.remove("hidden");
  node.classList.remove("inactive");
}

export function deactivate() {
  if (!ctx) {
    return;
  }
  let node = ctx.canvas.parentNode;
  node.classList.add("inactive");
}
