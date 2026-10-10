/**
 * Decoupled Application EventBus
 * Enables cross-module communication without direct database or code coupling.
 */

export type EventHandler<T = any> = (data: T) => void | Promise<void>;

export class EventBus {
  private static instance: EventBus;
  private listeners: Map<string, Set<EventHandler>> = new Map();

  private constructor() {}

  public static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }

  public on<T = any>(event: string, handler: EventHandler<T>): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(handler);

    // Return unbind function
    return () => this.off(event, handler);
  }

  public off(event: string, handler: EventHandler): void {
    const handlers = this.listeners.get(event);
    if (handlers) {
      handlers.delete(handler);
      if (handlers.size === 0) {
        this.listeners.delete(event);
      }
    }
  }

  public async emit<T = any>(event: string, data?: T): Promise<void> {
    const handlers = this.listeners.get(event);
    if (handlers) {
      const promises = Array.from(handlers).map((handler) => {
        try {
          return Promise.resolve(handler(data));
        } catch (err) {
          console.error(`Error in event listener for ${event}:`, err);
          return Promise.resolve();
        }
      });
      await Promise.all(promises);
    }
  }
}

export const eventBus = EventBus.getInstance();
