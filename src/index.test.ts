import { describe, test, expect } from "vitest";
import { WithEvents } from "../release/events";

describe("WithEvents", () => {
  describe("subscribe", () => {
    test("should call listeners when event is fired", () => {
      const events = new WithEvents<{
        data: [value: string];
      }>();

      const calls: string[] = [];

      events.subscribe({
        data: (value) => calls.push(value),
      });

      events.fire("data", "hello");
      events.fire("data", "world");

      expect(calls).toEqual(["hello", "world"]);
    });

    test("should pass source as last argument", () => {
      const events = new WithEvents<{
        dummy: [];
      }>();

      let receivedSource: typeof events | null = null;

      events.subscribe({
        dummy: (source) => {
          receivedSource = source;
        },
      });

      events.fire("dummy");

      expect(receivedSource).toBe(events);
    });

    test("should unsubscribe all events when calling returned function", () => {
      const events = new WithEvents<{
        a: [value: string];
        b: [];
      }>();
      const calls: string[] = [];

      const unsubscribe = events.subscribe({
        a: (value) => calls.push(value),
        b: () => calls.push("b"),
      });

      events.fire("a", "test");
      unsubscribe();
      events.fire("a", "ignored");
      events.fire("b");

      expect(calls).toEqual(["test"]);
    });

    test("should unsubscribe individual events via returned object properties", () => {
      const events = new WithEvents<{
        a: [value: string];
        b: [];
      }>();
      const calls: string[] = [];

      const unsubscribe = events.subscribe({
        a: (value) => calls.push(`a:${value}`),
        b: () => calls.push("b"),
      });

      events.fire("a", "first");
      events.fire("b");

      unsubscribe.a();

      events.fire("a", "ignored");
      events.fire("b");

      expect(calls).toEqual(["a:first", "b", "b"]);
    });

    test("should call unsubscriber callback with unsubscribe function", () => {
      const events = new WithEvents<{}>();
      let captured: (() => void) | null = null;

      const unsubscriber = events.subscribe({}, (unsub) => {
        captured = unsub;
      });

      expect(captured).not.toBeNull();
      expect(captured).toBe(unsubscriber);
    });
  });

  describe("once", () => {
    test("should call listener only once then auto-unsubscribe", () => {
      const events = new WithEvents<{
        data: [value: string];
      }>();
      const calls: string[] = [];

      events.once({
        data: (value) => calls.push(value),
      });

      events.fire("data", "first");
      events.fire("data", "second");
      events.fire("data", "third");

      expect(calls).toEqual(["first"]);
    });

    test("should handle multiple events independently", () => {
      const events = new WithEvents<{
        a: [value: string];
        b: [];
      }>();
      const calls: string[] = [];

      events.once({
        a: (value) => calls.push(`a:${value}`),
        b: () => calls.push("b"),
      });

      events.fire("a", "test");
      events.fire("b");
      events.fire("a", "ignored");
      events.fire("b");

      expect(calls).toEqual(["a:test", "b"]);
    });

    test("should allow manual unsubscribe before event fires", () => {
      const events = new WithEvents<{
        data: [value: string];
      }>();
      const calls: string[] = [];

      const unsubscribe = events.once({
        data: (value) => calls.push(value),
      });

      unsubscribe();
      events.fire("data", "ignored");

      expect(calls).toEqual([]);
    });
  });

  describe("until", () => {
    test("should unsubscribe when specified event fires", () => {
      const events = new WithEvents<{
        data: [value: string];
        condition: [];
      }>();
      const calls: string[] = [];

      events.until("condition").subscribe({
        data: (value) => calls.push(value),
      });

      events.fire("data", "first");
      events.fire("data", "second");
      events.fire("condition");
      events.fire("data", "ignored");

      expect(calls).toEqual(["first", "second"]);
    });

    test("should work with multiple subscribed events", () => {
      const events = new WithEvents<{
        data: [value: string];
        error: [message: string, code: number];
        condition: [];
      }>();
      const calls: string[] = [];

      events.until("condition").subscribe({
        data: (value) => calls.push(`data:${value}`),
        error: (msg, code) => calls.push(`error:${msg}:${code}`),
      });

      events.fire("data", "test");
      events.fire("error", "oops", 404);
      events.fire("condition");
      events.fire("data", "ignored");
      events.fire("error", "ignored", 500);

      expect(calls).toEqual(["data:test", "error:oops:404"]);
    });
  });

  describe("fire", () => {
    test("should invoke all listeners with correct arguments", () => {
      const events = new WithEvents<{
        change: [newValue: number, oldValue: number];
      }>();
      const calls: Array<[number, number]> = [];

      events.subscribe({
        change: (newVal, oldVal) => calls.push([newVal, oldVal]),
      });

      events.subscribe({
        change: (newVal, oldVal) => calls.push([newVal * 2, oldVal * 2]),
      });

      events.fire("change", 10, 5);

      expect(calls).toEqual([
        [10, 5],
        [20, 10],
      ]);
    });

    test("should handle events with no listeners gracefully", () => {
      const events = new WithEvents<{
        dummmy: [];
      }>();

      expect(() => events.fire("dummmy")).not.toThrow();
    });
  });

  describe("listenerCount", () => {
    test("should return 0 for events with no listeners", () => {
      const events = new WithEvents<{
        dummmy: [];
      }>();
      expect(events.listenerCount("dummmy")).toBe(0);
    });

    test("should return correct count for events with listeners", () => {
      const events = new WithEvents<{
        a: [];
        b: [];
      }>();

      events.subscribe({ a: () => {} });
      events.subscribe({ a: () => {} });
      events.subscribe({ b: () => {} });

      expect(events.listenerCount("a")).toBe(2);
      expect(events.listenerCount("b")).toBe(1);
    });

    test("should update count after unsubscribing", () => {
      const events = new WithEvents<{
        dummy: [];
      }>();

      const unsub1 = events.subscribe({ dummy: () => {} });
      const unsub2 = events.subscribe({ dummy: () => {} });

      expect(events.listenerCount("dummy")).toBe(2);

      unsub1.dummy(); // Use individual unsubscriber
      expect(events.listenerCount("dummy")).toBe(1);

      unsub2(); // Use unsubscribe-all (should be equivalent to unsub2.dummy() in this case)
      expect(events.listenerCount("dummy")).toBe(0);
    });
  });

  describe("listenerCounts", () => {
    test("should return counts for all registered events", () => {
      const events = new WithEvents<{
        a: [];
        b: [];
        c: [];
      }>();

      events.subscribe({ a: () => {}, b: () => {} });
      events.subscribe({ a: () => {} });
      events.subscribe({ c: () => {} });

      const counts = events.listenerCounts;

      expect(counts.a).toBe(2);
      expect(counts.b).toBe(1);
      expect(counts.c).toBe(1);
    });
  });

  describe("Collect", () => {
    test("should fire events on all instances in collection", () => {
      class Test extends WithEvents<{
        data: [value: string];
      }> {}

      const events = [new Test(), new Test(), new Test()];

      const calls: string[] = [];

      events[0].subscribe({ data: (value) => calls.push(`e1:${value}`) });
      events[1].subscribe({ data: (value) => calls.push(`e2:${value}`) });
      events[2].subscribe({ data: (value) => calls.push(`e3:${value}`) });

      const collection = WithEvents.Collect(events);
      collection.fire("data", "test");

      expect(calls).toEqual(["e1:test", "e2:test", "e3:test"]);
    });

    test("should subscribe to all instances with index parameter", () => {
      class Test extends WithEvents<{
        data: [value: string];
      }> {}
      const events = [new Test(), new Test(), new Test()];

      const calls: Array<[string, number]> = [];

      const collection = WithEvents.Collect(events);
      collection.subscribe({
        data: (value, source, index) => {
          expect(source).toBe(events[index]);
          calls.push([value, index]);
        },
      });

      events[0].fire("data", "first");
      events[1].fire("data", "second");
      events[2].fire("data", "third");

      expect(calls).toEqual([
        ["first", 0],
        ["second", 1],
        ["third", 2],
      ]);
    });

    test("should unsubscribe from all instances", () => {
      class Test extends WithEvents<{
        data: [value: string];
      }> {}

      const events = [new Test(), new Test()];

      const calls: string[] = [];

      const collection = WithEvents.Collect(events);

      const unsubscribe = collection.subscribe({
        data: (value) => calls.push(value),
      });

      events[0].fire("data", "test");
      unsubscribe();
      events[0].fire("data", "ignored");
      events[1].fire("data", "ignored");

      expect(calls).toEqual(["test"]);
    });

    test("should unsubscribe individual events from all instances", () => {
      class Test extends WithEvents<{
        data: [value: string];
        ready: [];
      }> {}

      const events = [new Test(), new Test()];

      const calls: string[] = [];

      const collection = WithEvents.Collect(events);
      const unsubscribe = collection.subscribe({
        data: (value) => calls.push(`data:${value}`),
        ready: () => calls.push("ready"),
      });

      events[0].fire("data", "test1");
      events[1].fire("ready");

      unsubscribe.data();

      events[0].fire("data", "ignored");
      events[1].fire("ready");

      expect(calls).toEqual(["data:test1", "ready", "ready"]);
    });
  });
});
