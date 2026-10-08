// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import * as keyboard from "../../src/util/keyboard.js";
import { DIRS } from "../../src/conf.js";

function key(init) {
  return new KeyboardEvent("keydown", init);
}

describe("keyboard direction mapping", () => {
  it("maps arrow and navigation keys", () => {
    expect(keyboard.getDirection(key({ key: "ArrowUp" }))).toBe(DIRS[1]);
    expect(keyboard.getDirection(key({ key: "ArrowRight" }))).toBe(DIRS[3]);
    expect(keyboard.getDirection(key({ key: "ArrowDown" }))).toBe(DIRS[5]);
    expect(keyboard.getDirection(key({ key: "ArrowLeft" }))).toBe(DIRS[7]);
    expect(keyboard.getDirection(key({ key: "Home" }))).toBe(DIRS[0]);
    expect(keyboard.getDirection(key({ key: "PageUp" }))).toBe(DIRS[2]);
    expect(keyboard.getDirection(key({ key: "PageDown" }))).toBe(DIRS[4]);
    expect(keyboard.getDirection(key({ key: "End" }))).toBe(DIRS[6]);
  });

  it("maps the numeric keypad by physical key, whatever NumLock says", () => {
    expect(keyboard.getDirection(key({ key: "7", code: "Numpad7" }))).toBe(DIRS[0]);
    expect(keyboard.getDirection(key({ key: "Home", code: "Numpad7" }))).toBe(DIRS[0]);
    expect(keyboard.getDirection(key({ key: "2", code: "Numpad2" }))).toBe(DIRS[5]);
    expect(keyboard.getDirection(key({ key: "6", code: "Numpad6" }))).toBe(DIRS[3]);
  });

  it("maps vi keys, ignoring shift", () => {
    expect(keyboard.getDirection(key({ key: "k" }))).toBe(DIRS[1]);
    expect(keyboard.getDirection(key({ key: "K", shiftKey: true }))).toBe(DIRS[1]);
    expect(keyboard.getDirection(key({ key: "y" }))).toBe(DIRS[0]);
    expect(keyboard.getDirection(key({ key: "n" }))).toBe(DIRS[4]);
  });

  it("returns null for anything else", () => {
    expect(keyboard.getDirection(key({ key: "x" }))).toBeNull();
    expect(keyboard.getDirection(key({ key: "Enter" }))).toBeNull();
    expect(keyboard.getDirection(key({ key: "7" }))).toBeNull();
  });
});

describe("keyboard predicates", () => {
  it("recognises Enter, Space and Escape", () => {
    expect(keyboard.isEnter(key({ key: "Enter" }))).toBe(true);
    expect(keyboard.isSpace(key({ key: " " }))).toBe(true);
    expect(keyboard.isEscape(key({ key: "Escape" }))).toBe(true);
    expect(keyboard.isEnter(key({ key: " " }))).toBe(false);
  });

  it("reports modifier keys", () => {
    expect(keyboard.hasModifier(key({ key: "k" }))).toBe(false);
    expect(keyboard.hasModifier(key({ key: "k", ctrlKey: true }))).toBe(true);
    expect(keyboard.hasModifier(key({ key: "k", shiftKey: true }))).toBe(true);
    expect(keyboard.hasModifier(key({ key: "k", altKey: true }))).toBe(true);
    expect(keyboard.hasModifier(key({ key: "k", metaKey: true }))).toBe(true);
  });

  it("extracts digits", () => {
    expect(keyboard.getNumber(key({ key: "0" }))).toBe(0);
    expect(keyboard.getNumber(key({ key: "9" }))).toBe(9);
    expect(keyboard.getNumber(key({ key: "a" }))).toBeNull();
    expect(keyboard.getNumber(key({ key: "Enter" }))).toBeNull();
  });
});

describe("keyboard consumer stack", () => {
  afterEach(() => {
    // Drain anything a test left behind.
    for (let i = 0; i < 5; i++) {
      keyboard.pop();
    }
  });

  it("does nothing when nobody is listening", () => {
    expect(() => document.dispatchEvent(key({ key: "Enter" }))).not.toThrow();
  });

  it("routes document keydown events to the top consumer only", () => {
    let bottom = { handleKeyEvent: vi.fn() };
    let top = { handleKeyEvent: vi.fn() };
    keyboard.push(bottom);
    keyboard.push(top);

    document.dispatchEvent(key({ key: "Enter" }));

    expect(top.handleKeyEvent).toHaveBeenCalledTimes(1);
    expect(bottom.handleKeyEvent).not.toHaveBeenCalled();
  });

  it("falls back to the previous consumer after pop", () => {
    let bottom = { handleKeyEvent: vi.fn() };
    let top = { handleKeyEvent: vi.fn() };
    keyboard.push(bottom);
    keyboard.push(top);
    keyboard.pop();

    document.dispatchEvent(key({ key: "Enter" }));

    expect(bottom.handleKeyEvent).toHaveBeenCalledTimes(1);
    expect(top.handleKeyEvent).not.toHaveBeenCalled();
  });
});

describe("keeping the browser out of it", () => {
  afterEach(() => {
    for (let i = 0; i < 5; i++) {
      keyboard.pop();
    }
  });

  function cancellable(init) {
    return new KeyboardEvent("keydown", { cancelable: true, ...init });
  }

  it("prevents the default action of keys the game handles", () => {
    keyboard.push({ handleKeyEvent: () => {} });

    let plain = cancellable({ key: "ArrowLeft" });
    document.dispatchEvent(plain);
    expect(plain.defaultPrevented).toBe(true);

    // A modifier with an arrow is browser history navigation: upstream issue #1.
    let back = cancellable({ key: "ArrowLeft", altKey: true });
    document.dispatchEvent(back);
    expect(back.defaultPrevented).toBe(true);
    let macBack = cancellable({ key: "ArrowLeft", metaKey: true });
    document.dispatchEvent(macBack);
    expect(macBack.defaultPrevented).toBe(true);

    let space = cancellable({ key: " " });
    document.dispatchEvent(space);
    expect(space.defaultPrevented).toBe(true);

    let digit = cancellable({ key: "3" });
    document.dispatchEvent(digit);
    expect(digit.defaultPrevented).toBe(true);
  });

  it("leaves other keys alone", () => {
    keyboard.push({ handleKeyEvent: () => {} });
    let reload = cancellable({ key: "r", ctrlKey: true });
    document.dispatchEvent(reload);
    expect(reload.defaultPrevented).toBe(false);
  });

  it("leaves everything alone when nobody is listening", () => {
    let arrow = cancellable({ key: "ArrowLeft" });
    document.dispatchEvent(arrow);
    expect(arrow.defaultPrevented).toBe(false);
  });
});
