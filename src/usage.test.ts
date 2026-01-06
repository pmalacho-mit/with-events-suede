import { describe, test, expect } from "vitest";
import { WithEvents } from "../release/events";

describe("WithEvents usage examples", () => {
  test("untyped", () => {
    // pd:simple
    const seen: string[] = [];

    const bus = new WithEvents<{
      message: [text: string];
      done: [];
    }>();

    const unsubscribe = bus.subscribe({
      message: (text, target) => {
        // pd:simple-body
        seen.push(text);
        // pd:simple-body
      },
      done: (target: typeof bus) => {
        // pd:simple-body
        seen.push("done");
        // pd:simple-body
      },
    });

    bus.fire("message", "hello");
    bus.fire("message", "world");
    unsubscribe.message();

    bus.fire("done");
    unsubscribe();
    // pd:simple
  });

  test("as base class", () => {
    // pd:base
    class Logger extends WithEvents<{
      log: [level: "info" | "warn" | "error", message: string];
    }> {
      info(message: string) {
        this.fire("log", "info", message);
      }

      warn(message: string) {
        this.fire("log", "warn", message);
      }

      error(message: string) {
        this.fire("log", "error", message);
      }
    }

    const logger = new Logger();

    logger.subscribe({
      log: (level, message, target) => {
        console.log(`[${level.toUpperCase()}] ${message}`);
      },
    });

    logger.info("This is an informational message.");
    logger.warn("This is a warning message.");
    logger.error("This is an error message.");
    // pd:base
  });

  test("subscribe / fire / unsubscribe", () => {
    // pd:verbose
    const bus = new WithEvents<{
      message: [text: string];
      done: [];
    }>();

    const seen: string[] = [];

    type Unsubscribe = (() => void) & Record<"message" | "done", () => void>;

    const unsubscribe: Unsubscribe = bus.subscribe({
      message: (text: string, target: typeof bus) => {
        console.log(`${target} received message: ${text}`);
        seen.push(text);
      },
      done: (target: typeof bus) => {
        console.log(`${target} received done`);
        seen.push("finished");
      },
    });

    bus.fire("message", "hello");
    bus.fire("message", "world");
    bus.fire("done");

    // Unsubscribe a single event
    unsubscribe.message();
    bus.fire("message", "ignored");

    // Unsubscribe all events
    unsubscribe();
    bus.fire("done");

    seen.length; // 3
    seen[0]; // "hello"
    seen[1]; // "world"
    seen[2]; // "finished"
    // pd:verbose

    expect(seen).toEqual(["hello", "world", "finished"]);
  });

  test("once for one-time listeners", () => {
    // pd:once
    const bus = new WithEvents<{ ping: [id: number] }>();
    const seen: number[] = [];

    bus.once({
      ping: (id: number, target: typeof bus) => {
        console.log(`${target} received ping: ${id}`);
        seen.push(id);
      },
    });

    bus.fire("ping", 1);
    bus.fire("ping", 2); // Ignored

    seen.length; // 1
    seen[0]; // 1
    // pd:once

    expect(seen).toEqual([1]);
  });

  test("until to auto-unsubscribe when a trigger fires", () => {
    // pd:until
    const bus = new WithEvents<{ data: [value: string]; stop: [] }>();
    const seen: string[] = [];

    // Subscriptions stay active until "stop" fires
    bus.until("stop").subscribe({
      data: (value) => seen.push(value),
    });

    bus.fire("data", "first");
    bus.fire("data", "second");
    bus.fire("stop");
    bus.fire("data", "ignored");

    seen.length; // 2
    seen[0]; // "first"
    seen[1]; // "second"
    // pd:until

    expect(seen).toEqual(["first", "second"]);
  });

  test("Collect to fan-out across multiple instances", () => {
    class Widget extends WithEvents<{ change: [value: number] }> {
      set(value: number) {
        this.fire("change", value);
      }
    }

    const widgets = [new Widget(), new Widget(), new Widget()];
    const collection = WithEvents.Collect(widgets);
    const seen: Array<[number, number]> = [];

    // Subscribe once to receive events from all instances with index and source
    collection.subscribe({
      change: (value, source, index) => {
        expect(source).toBe(widgets[index]);
        seen.push([value, index]);
      },
    });

    widgets[0].set(1);
    widgets[1].set(2);
    widgets[2].set(3);

    collection.fire("change", 42);

    expect(seen).toEqual([
      [1, 0],
      [2, 1],
      [3, 2],
      [42, 0],
      [42, 1],
      [42, 2],
    ]);
  });
});
