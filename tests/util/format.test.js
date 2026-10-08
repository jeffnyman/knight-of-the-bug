import { describe, expect, it } from "vitest";
import { format } from "../../src/util/format.js";

const rat = {
  toString: () => "rat",
  describeThe: () => "the rat",
  describeA: () => "a rat",
  describeIt: () => "it",
  describeVerb: (verb) => `${verb}s`,
};

const you = {
  toString: () => "you",
  describeThe: () => "you",
  describeA: () => "you",
  describeIt: () => "you",
  describeVerb: (verb) => verb,
};

describe("format", () => {
  it("leaves plain text alone", () => {
    expect(format("nothing to see here")).toBe("nothing to see here");
  });

  it("substitutes %s with toString", () => {
    expect(format("found %s", rat)).toBe("found rat");
    expect(format("%s coins", 5)).toBe("5 coins");
  });

  it("substitutes %the and %a", () => {
    expect(format("You attack %the.", rat)).toBe("You attack the rat.");
    expect(format("You see %a.", rat)).toBe("You see a rat.");
  });

  it("capitalises when the placeholder is capitalised", () => {
    expect(format("%The bites.", rat)).toBe("The rat bites.");
    expect(format("%A is lying here.", rat)).toBe("A rat is lying here.");
  });

  it("consumes arguments in order", () => {
    expect(format("%The %{verb,hit} %it.", rat, rat, you)).toBe(
      "The rat hits you.",
    );
    expect(format("%The %{verb,hit} %it.", you, you, rat)).toBe(
      "You hit it.",
    );
  });

  it("passes braced arguments to the method", () => {
    expect(format("%{verb,do}", rat)).toBe("dos");
  });

  it("leaves unknown placeholders untouched", () => {
    expect(format("%zebra stays", rat)).toBe("%zebra stays");
  });

  it("leaves placeholders alone when arguments run out", () => {
    expect(format("%s and %s", rat)).toBe("rat and %s");
  });

  it("treats a doubled percent sign as an escape", () => {
    expect(format("100%%s", rat)).toBe("100%s");
  });
});
