import { jest } from '@jest/globals';
import { EventEmitter } from 'src/utils/EventEmitter';

type TestEventMap = {
  click: [hex: string];
  changed: [colors: string[], count: number];
};

describe('EventEmitter', () => {
  let emitter: EventEmitter<TestEventMap>;

  beforeEach(() => {
    jest.clearAllMocks();
    emitter = new EventEmitter<TestEventMap>();
  });

  describe('on and emit', () => {
    it('calls a registered listener with emitted arguments', () => {
      const handler = jest.fn();
      emitter.on('click', handler);

      emitter.emit('click', '#fff');

      expect(handler).toHaveBeenCalledWith('#fff');
    });

    it('calls multiple listeners for the same event', () => {
      const first = jest.fn();
      const second = jest.fn();
      emitter.on('changed', first);
      emitter.on('changed', second);

      emitter.emit('changed', ['#ff0000'], 1);

      expect(first).toHaveBeenCalledWith(['#ff0000'], 1);
      expect(second).toHaveBeenCalledWith(['#ff0000'], 1);
    });
  });

  describe('off', () => {
    it('does not call a removed listener', () => {
      const handler = jest.fn();
      emitter.on('click', handler);
      emitter.off('click', handler);

      emitter.emit('click', '#000');

      expect(handler).not.toHaveBeenCalled();
    });

    it('keeps other listeners registered after removing one', () => {
      const removed = jest.fn();
      const kept = jest.fn();
      emitter.on('click', removed);
      emitter.on('click', kept);
      emitter.off('click', removed);

      emitter.emit('click', '#abc');

      expect(removed).not.toHaveBeenCalled();
      expect(kept).toHaveBeenCalledWith('#abc');
    });
  });

  describe('clear', () => {
    it('removes all listeners', () => {
      const handler = jest.fn();
      emitter.on('click', handler);
      emitter.clear();

      emitter.emit('click', '#fff');

      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe('when no listeners are registered', () => {
    it('does not throw on emit', () => {
      expect(() => emitter.emit('click', '#fff')).not.toThrow();
    });
  });
});
