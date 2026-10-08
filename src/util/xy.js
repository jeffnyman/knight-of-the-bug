// A small immutable 2D vector. Every operation returns a new XY, so
// instances can be freely shared. Converting to a string gives "x,y",
// which lets an XY be used directly as an object key.
export default class XY {
  static fromString(text) {
    let numbers = text.split(",").map(Number);
    return new this(...numbers);
  }

  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }

  clone() {
    return new XY(this.x, this.y);
  }

  toString() {
    return `${this.x},${this.y}`;
  }

  is(xy) {
    return this.x == xy.x && this.y == xy.y;
  }

  // Chebyshev length: the number of king moves needed to cover the vector.
  norm8() {
    return Math.max(Math.abs(this.x), Math.abs(this.y));
  }

  // Manhattan length: the number of rook moves needed to cover the vector.
  norm4() {
    return Math.abs(this.x) + Math.abs(this.y);
  }

  // Euclidean length.
  norm() {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }

  dist8(xy) {
    return this.minus(xy).norm8();
  }

  dist4(xy) {
    return this.minus(xy).norm4();
  }

  dist(xy) {
    return this.minus(xy).norm();
  }

  // Linear interpolation towards another point. A fraction of 0 is this
  // point, 1 is the other point, 0.5 is halfway between.
  lerp(xy, fraction) {
    let difference = xy.minus(this);
    return this.plus(difference.scale(fraction));
  }

  scale(sx, sy = sx) {
    return new XY(this.x * sx, this.y * sy);
  }

  plus(xy) {
    return new XY(this.x + xy.x, this.y + xy.y);
  }

  minus(xy) {
    return this.plus(xy.scale(-1));
  }

  round() {
    return new XY(Math.round(this.x), Math.round(this.y));
  }

  floor() {
    return new XY(Math.floor(this.x), Math.floor(this.y));
  }

  ceil() {
    return new XY(Math.ceil(this.x), Math.ceil(this.y));
  }

  // Component-wise modulo that always yields a non-negative result, so a
  // cursor can wrap around a board in either direction.
  mod(xy) {
    let x = this.x % xy.x;
    if (x < 0) {
      x += xy.x;
    }

    let y = this.y % xy.y;
    if (y < 0) {
      y += xy.y;
    }

    return new XY(x, y);
  }
}
