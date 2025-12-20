import type { Expand } from "./utils";

type PayloadsConstraint = Record<string | number, any[]>;

export type PayloadsToEvents<T extends PayloadsConstraint, Source> = {
  [k in keyof T]: (...payload: [source: Source, ...T[k]]) => void;
};

export class WithEvents<Payloads extends PayloadsConstraint> {
  private readonly listeners = new Map<
    keyof Payloads,
    Set<(...payload: any) => void>
  >();

  /**
   * Subscribes to one or more events.
   * Returns an unsubscribe function for unsubscribing all events, with extra properties for unsubscribing individual event keys.
   * @param callbacks
   * @param unsubscriber - A callback that will be provided with the unsubscribe function for unsubscribing all events.
   * (Useful for things like svelte's `onDestroy`.)
   * @returns {Function & Record<string, Function>}
   */
  subscribe<T extends Expand<Partial<PayloadsToEvents<Payloads, typeof this>>>>(
    callbacks: T,
    unsubscriber?: (unsubscribe: () => void) => void
  ) {
    const unsubscribers = {} as { [key in keyof T]: () => void };

    type Events = PayloadsToEvents<Payloads, typeof this>;
    for (const key in callbacks) {
      const event = key as keyof Events & keyof typeof callbacks;
      const callback = callbacks[event] as Events[keyof Events];
      this.listeners.get(event)?.add(callback) ??
        this.listeners.set(event, new Set([callback]));

      unsubscribers[event] = () => {
        this.listeners.get(event)?.delete(callback);
      };
    }

    const unsubscribeAll = () => {
      for (const key in callbacks) {
        unsubscribers[key as keyof T]?.();
      }
    };

    unsubscriber?.(unsubscribeAll);

    return Object.assign(unsubscribeAll, unsubscribers);
  }

  once<T extends Expand<Partial<PayloadsToEvents<Payloads, typeof this>>>>(
    callbacks: T,
    unsubscriber?: (unsubscribe: () => void) => void
  ) {
    let unsubscribe: ReturnType<typeof this.subscribe<T>>;
    const wrappedCallbacks = {} as T;
    for (const key in callbacks) {
      const callback = callbacks[key] as (...payload: any[]) => void;
      const wrapped = (...payload: Parameters<typeof callback>) => {
        callback(...payload);
        unsubscribe[key]();
      };
      wrappedCallbacks[key as keyof T] = wrapped as T[keyof T];
    }
    unsubscribe = this.subscribe(wrappedCallbacks, unsubscriber);
    return unsubscribe;
  }

  subscribeUntil<
    Event extends keyof Payloads,
    T extends Expand<Partial<PayloadsToEvents<Payloads, typeof this>>>,
  >(event: Event, callbacks: T) {
    const unsubscribe = this.subscribe(callbacks);
    const onEvent = { [event]: unsubscribe };
    return this.once(onEvent as T);
  }

  fire<Event extends keyof Payloads>(
    event: Event,
    ...payload: Payloads[Event]
  ) {
    this.listeners
      .get(event)
      ?.forEach((callback) => callback(this, ...payload));
  }

  unsubscribeAll() {
    this.listeners.clear();
  }

  listenerCount(event: keyof Payloads) {
    return this.listeners.get(event)?.size ?? 0;
  }

  listenerCounts() {
    type Counts = Record<keyof Payloads, number>;
    let counts: Partial<Counts> = {};
    for (const [event, listeners] of this.listeners)
      counts = {
        ...counts,
        get [event]() {
          return listeners.size;
        },
      };
    return counts as Counts;
  }
}

export type IWithEvents<Payloads extends PayloadsConstraint> = Pick<
  WithEvents<Payloads>,
  keyof WithEvents<Payloads>
>;
