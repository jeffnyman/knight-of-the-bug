// Animates blocks sliding down the combat board. Each item is
// { cell, from, to }: while the animation runs, cell.animated holds the
// block's current position between from and to; afterwards it is null.
const SPEED = 10; // cells per second

function schedule(callback) {
  if (typeof requestAnimationFrame == "function") {
    requestAnimationFrame(callback);
  } else {
    setTimeout(callback, 16);
  }
}

export default class Animation {
  constructor() {
    this._items = [];
    this._started = null;
    this._resolve = null;
    this._drawCallback = null;
  }

  add(item) {
    this._items.push(item);
    item.cell.animated = item.from;
  }

  // Runs the animation, calling drawCallback after every step. Resolves
  // once every block has arrived.
  start(drawCallback) {
    let promise = new Promise((resolve) => (this._resolve = resolve));
    this._drawCallback = drawCallback;
    this._started = Date.now();
    this._step();
    return promise;
  }

  _step() {
    let elapsed = Date.now() - this._started;

    // Walk backwards so finished items can be spliced out as we go.
    let i = this._items.length;
    while (i-- > 0) {
      let item = this._items[i];
      let finished = this._stepItem(item, elapsed);
      if (finished) {
        this._items.splice(i, 1);
        item.cell.animated = null;
      }
    }

    this._drawCallback();

    if (this._items.length > 0) {
      schedule(() => this._step());
    } else {
      this._resolve();
    }
  }

  _stepItem(item, elapsed) {
    let distance = item.from.dist8(item.to);

    let fraction = ((elapsed / 1000) * SPEED) / distance;
    let finished = false;
    if (fraction >= 1) {
      finished = true;
      fraction = 1;
    }

    item.cell.animated = item.from.lerp(item.to, fraction);

    return finished;
  }
}
