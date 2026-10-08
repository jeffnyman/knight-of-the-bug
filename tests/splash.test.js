// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import * as splash from "../src/screens/splash/splash.js";

describe("splash screen", () => {
  it("fills the container and clears it again on Enter", async () => {
    let container = document.createElement("div");
    document.body.appendChild(container);

    let done = splash.load(container);

    expect(container.querySelector(".title")).not.toBeNull();
    expect(container.querySelector(".tower")).not.toBeNull();
    expect(container.querySelector(".byline").textContent).toBe("by Jeff Nyman");
    expect(container.querySelector(".blurb")).not.toBeNull();

    document.dispatchEvent(new KeyboardEvent("keydown", { key: "x" }));
    expect(container.childElementCount).toBe(6);

    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
    await done;

    expect(container.childElementCount).toBe(0);
  });
});
