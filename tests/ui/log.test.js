// @vitest-environment jsdom
import { beforeAll, describe, expect, it } from "vitest";
import * as log from "../../src/ui/log.js";
import Entity from "../../src/entity.js";

let node;

describe("log", () => {
  it("ignores messages before it is initialised", () => {
    expect(() => log.add("too early")).not.toThrow();
    expect(() => log.pause()).not.toThrow();
  });

  describe("once initialised", () => {
    beforeAll(() => {
      node = document.createElement("div");
      node.classList.add("hidden");
      document.body.appendChild(node);
      log.init(node);
    });

    it("reveals its element and opens a first paragraph", () => {
      expect(node.classList.contains("hidden")).toBe(false);
      expect(node.querySelectorAll("p")).toHaveLength(1);
    });

    it("appends formatted messages to the current paragraph", () => {
      let rat = new Entity({ name: "rat" });
      log.add("You see %a.", rat);
      let paragraph = node.querySelector("p");
      expect(paragraph.textContent).toContain("You see a rat.");
    });

    it("turns colour markup into spans", () => {
      log.add("Press {#fff}Enter{} now");
      let span = node.querySelector("p span span");
      expect(span.textContent).toBe("Enter");
      expect(span.style.color).toBe("rgb(255, 255, 255)");
    });

    it("turns newlines into line breaks", () => {
      log.add("one\ntwo");
      expect(node.querySelectorAll("br").length).toBeGreaterThan(0);
    });

    it("starts a new paragraph on pause, but never an empty one", () => {
      log.pause();
      let count = node.querySelectorAll("p").length;
      log.pause();
      log.pause();
      expect(node.querySelectorAll("p")).toHaveLength(count);

      log.add("filler");
      log.pause();
      expect(node.querySelectorAll("p")).toHaveLength(count + 1);
    });

    it("keeps only the most recent fifty paragraphs", () => {
      for (let i = 0; i < 80; i++) {
        log.add(`message ${i}`);
        log.pause();
      }
      expect(node.querySelectorAll("p").length).toBeLessThanOrEqual(50);
      expect(node.textContent).toContain("message 79");
      expect(node.textContent).not.toContain("message 1 ");
    });
  });
});
