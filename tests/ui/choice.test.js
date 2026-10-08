import { describe, expect, it } from "vitest";
import choice from "../../src/ui/choice.js";
import * as keyboard from "../../src/util/keyboard.js";

describe("choice", () => {
  it("resolves with the index of the chosen number", async () => {
    let promise = choice(["kiss", "talk", "attack"]);
    keyboard.dispatch({ key: "2" });
    await expect(promise).resolves.toBe(1);
  });

  it("resolves with -1 on Escape or zero", async () => {
    let promise = choice(["kiss"]);
    keyboard.dispatch({ key: "Escape" });
    await expect(promise).resolves.toBe(-1);

    promise = choice(["kiss"]);
    keyboard.dispatch({ key: "0" });
    await expect(promise).resolves.toBe(-1);
  });

  it("ignores numbers beyond the options and other keys", async () => {
    let settled = false;
    let promise = choice(["kiss", "talk"]).then((v) => {
      settled = true;
      return v;
    });

    keyboard.dispatch({ key: "5" });
    keyboard.dispatch({ key: "Enter" });
    keyboard.dispatch({ key: "a" });
    await Promise.resolve();
    expect(settled).toBe(false);

    keyboard.dispatch({ key: "1" });
    await expect(promise).resolves.toBe(0);
  });

  it("hands the keyboard back when done", async () => {
    let underneath = { handleKeyEvent: () => {} };
    keyboard.push(underneath);

    let promise = choice(["kiss"]);
    keyboard.dispatch({ key: "1" });
    await promise;

    let received = null;
    underneath.handleKeyEvent = (e) => (received = e);
    keyboard.dispatch({ key: "z" });
    expect(received).toEqual({ key: "z" });
    keyboard.pop();
  });
});
