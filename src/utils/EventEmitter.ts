export type Listener<T extends Array<any>> = (...args: T) => void;

export class EventEmitter<EventMap extends Record<string, Array<any>>> {
    private eventListeners: { [K in keyof EventMap]?: Set<Listener<EventMap[K]>>} = {};

    public on<K extends keyof EventMap>(eventName: K, listener: Listener<EventMap[K]>) {
        const listeners = this.eventListeners[eventName] ?? new Set();
        listeners.add(listener);
        this.eventListeners[eventName] = listeners;
    }

    public off<K extends keyof EventMap>(eventName: K, listener: Listener<EventMap[K]>) {
        const listeners = this.eventListeners[eventName] ?? new Set();
        listeners.delete(listener);
        this.eventListeners[eventName] = listeners;
    }

    public emit<K extends keyof EventMap>(eventName: K, ...args: EventMap[K]) {
        const listeners = this.eventListeners[eventName] ?? new Set();
        for(const listener of listeners) {
            listener(...args);
        }
    }

    public clear() {
        this.eventListeners = {};
    }
}