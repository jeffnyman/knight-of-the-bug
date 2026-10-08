import { describe, expect, it, vi } from "vitest";
import { publish, subscribe, unsubscribe } from "../../src/util/pubsub.js";

describe("pubsub", () => {
  it("delivers to function subscribers", () => {
    let subscriber = vi.fn();
    subscribe("ping", subscriber);

    publish("ping", "me", { n: 1 });

    expect(subscriber).toHaveBeenCalledWith("ping", "me", { n: 1 });
    unsubscribe("ping", subscriber);
  });

  it("delivers to objects with a handleMessage method", () => {
    let subscriber = { handleMessage: vi.fn() };
    subscribe("pong", subscriber);

    publish("pong", "you");

    expect(subscriber.handleMessage).toHaveBeenCalledWith("pong", "you", undefined);
    unsubscribe("pong", subscriber);
  });

  it("ignores messages nobody subscribed to", () => {
    expect(() => publish("nothing-listens", null)).not.toThrow();
  });

  it("stops delivering after unsubscribe", () => {
    let subscriber = vi.fn();
    subscribe("once", subscriber);
    unsubscribe("once", subscriber);

    publish("once", null);

    expect(subscriber).not.toHaveBeenCalled();
  });

  it("tolerates unsubscribing something that was never subscribed", () => {
    expect(() => unsubscribe("never", () => {})).not.toThrow();
  });

  it("still reaches later subscribers when an earlier one unsubscribes itself", () => {
    let second = vi.fn();
    let first = vi.fn(() => unsubscribe("self-remove", first));
    subscribe("self-remove", first);
    subscribe("self-remove", second);

    publish("self-remove", null);

    expect(first).toHaveBeenCalledTimes(1);
    expect(second).toHaveBeenCalledTimes(1);
    unsubscribe("self-remove", second);
  });
});
