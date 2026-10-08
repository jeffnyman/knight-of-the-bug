import { beforeEach, describe, expect, it } from "vitest";
import * as actors from "../../src/util/actors.js";

// Let every pending promise callback run.
async function settle() {
  for (let i = 0; i < 10; i++) {
    await Promise.resolve();
  }
}

function actorThatStopsAfter(name, turns, record) {
  let taken = 0;
  let actor = {
    act() {
      record.push(name);
      taken++;
      if (taken >= turns) {
        actors.remove(actor);
      }
      return Promise.resolve();
    },
  };
  return actor;
}

describe("actors", () => {
  beforeEach(() => actors.clear());

  it("does nothing with an empty queue", () => {
    expect(() => actors.loop()).not.toThrow();
  });

  it("gives each actor a turn in round-robin order", async () => {
    let record = [];
    actors.add(actorThatStopsAfter("a", 2, record));
    actors.add(actorThatStopsAfter("b", 2, record));

    actors.loop();
    await settle();

    expect(record).toEqual(["a", "b", "a", "b"]);
  });

  it("waits for an actor's promise before moving on", async () => {
    let record = [];
    let release = null;
    let blocker = {
      act() {
        record.push("blocker");
        return new Promise((r) => (release = r));
      },
    };
    actors.add(blocker);
    actors.add(actorThatStopsAfter("other", 1, record));

    actors.loop();
    await settle();
    expect(record).toEqual(["blocker"]);

    actors.remove(blocker);
    release();
    await settle();
    expect(record).toEqual(["blocker", "other"]);
  });

  it("stops once every actor has been removed", async () => {
    let record = [];
    actors.add(actorThatStopsAfter("solo", 3, record));

    actors.loop();
    await settle();

    expect(record).toEqual(["solo", "solo", "solo"]);
    expect(actors.getQueue()).toEqual([]);
  });

  it("ignores removing an actor that is not queued", () => {
    expect(() => actors.remove({})).not.toThrow();
  });
});
