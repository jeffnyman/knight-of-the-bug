import { format } from "../util/format.js";

// The scrolling message log. Messages are grouped into paragraphs; a call
// to pause() ends the current paragraph. Messages support the formatter's
// placeholders plus an inline colour syntax: "{#f00}red text{}".
const MAX_PARAGRAPHS = 50;

let node = null;
let current = null;

export function add(template, ...args) {
  if (!current) {
    return;
  }

  let text = format(template, ...args);

  text = text.replace(/{(.*?)}(.*?){}/g, (match, color, content) => {
    return `<span style="color:${color}">${content}</span>`;
  });

  text = text.replace(/\n/g, "<br/>");

  let item = document.createElement("span");
  item.innerHTML = `${text} `;
  current.appendChild(item);
}

export function pause() {
  if (!node) {
    return;
  }

  // Don't stack up empty paragraphs (but do replace one that is no longer
  // in the panel, say because the panel was cleared).
  let attached = current && current.parentNode == node;
  if (attached && current.childNodes.length == 0) {
    return;
  }

  current = document.createElement("p");
  node.appendChild(current);

  while (node.childNodes.length > MAX_PARAGRAPHS) {
    node.removeChild(node.firstChild);
  }
}

export function init(element) {
  node = element;
  node.classList.remove("hidden");

  pause();

  // Keep the newest messages in view by nudging the scroll position.
  setInterval(() => {
    node.scrollTop += 3;
  }, 20);
}
