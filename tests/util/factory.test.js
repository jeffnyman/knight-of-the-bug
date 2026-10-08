import { beforeEach, describe, expect, it } from "vitest";
import { RNG } from "rot-js";
import * as factory from "../../src/util/factory.js";
import * as items from "../../src/item/items.js";
import * as beings from "../../src/being/beings.js";
import Item, { Drinkable, Wearable } from "../../src/item/item.js";
import Being from "../../src/being/being.js";

beforeEach(() => RNG.setSeed(2024));

describe("factory", () => {
  it("produces wearable items", () => {
    for (let i = 0; i < 30; i++) {
      expect(factory.getItem(3)).toBeInstanceOf(Wearable);
    }
  });

  it("produces beings with a danger rating, never heroes", () => {
    for (let i = 0; i < 30; i++) {
      let being = factory.getBeing(4);
      expect(being).toBeInstanceOf(Being);
      expect(being).not.toBeInstanceOf(beings.Colleague);
      expect(being.constructor.danger).toBeDefined();
    }
  });

  it("never produces anything much harder than requested", () => {
    for (let i = 0; i < 200; i++) {
      expect(factory.getBeing(2).constructor.danger).toBeLessThanOrEqual(3);
      expect(factory.getItem(1).constructor.danger).toBeLessThanOrEqual(2);
    }
  });

  it("mostly produces things of the requested danger", () => {
    let matching = 0;
    for (let i = 0; i < 200; i++) {
      if (factory.getItem(3).constructor.danger == 3) {
        matching++;
      }
    }
    expect(matching).toBeGreaterThan(60);
  });

  it("produces the hardest things on the last floor", () => {
    let seen = new Set();
    for (let i = 0; i < 100; i++) {
      seen.add(factory.getBeing(8).constructor);
    }
    expect(seen.has(beings.StackOverflow) || seen.has(beings.FlakyTest)).toBe(true);
  });

  it("produces coffee or energy drinks", () => {
    let kinds = new Set();
    for (let i = 0; i < 40; i++) {
      let potion = factory.getDrink();
      expect(potion).toBeInstanceOf(Drinkable);
      expect(potion).toBeInstanceOf(Item);
      kinds.add(potion.constructor);
    }
    expect(kinds).toEqual(new Set([items.Coffee, items.EnergyDrink]));
  });

  it("is reproducible for a given seed", () => {
    RNG.setSeed(77);
    let first = Array.from({ length: 10 }, () => factory.getBeing(5).constructor);
    RNG.setSeed(77);
    let second = Array.from({ length: 10 }, () => factory.getBeing(5).constructor);
    expect(first).toEqual(second);
  });
});
