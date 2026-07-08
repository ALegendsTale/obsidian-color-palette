import { jest } from '@jest/globals';
import { DragDrop } from 'src/utils/dragDropUtils';

function createDraggableElements(count: number, startX = 0, width = 100, gap = 10): HTMLElement[] {
  return Array.from({ length: count }, (_, index) => {
    const el = document.createElement('div');
    el.textContent = `item-${index}`;
    const left = startX + index * (width + gap);
    el.getBoundingClientRect = jest.fn(() => ({
      left,
      top: 0,
      right: left + width,
      bottom: 50,
      width,
      height: 50,
      x: left,
      y: 0,
      toJSON: () => ({}),
    })) as any;
    return el;
  });
}

function createDragEvent(type: string, clientX: number, dataTransfer?: DataTransfer): DragEvent {
  return new DragEvent(type, {
    bubbles: true,
    cancelable: true,
    clientX,
    dataTransfer,
  });
}

describe('DragDrop', () => {
  let dropzone: HTMLElement;
  let draggables: HTMLElement[];
  let onDrop: jest.Mock;
  let dragDrop: DragDrop;

  beforeEach(() => {
    jest.clearAllMocks();
    dropzone = document.createElement('div');
    draggables = createDraggableElements(3);
    draggables.forEach((el) => dropzone.appendChild(el));
    onDrop = jest.fn();
    dragDrop = new DragDrop([dropzone], draggables, onDrop);
  });

  describe('load', () => {
    it('sets draggable attribute on all draggables', () => {
      draggables.forEach((el) => {
        expect(el.getAttribute('draggable')).toBe('true');
      });
    });
  });

  describe('unload', () => {
    it('removes event listeners from draggables and dropzones', () => {
      const removeSpy = jest.spyOn(HTMLElement.prototype, 'removeEventListener');

      dragDrop.unload();

      expect(removeSpy).toHaveBeenCalled();
      removeSpy.mockRestore();
    });
  });

  describe('getDraggingElement', () => {
    it('returns the element with is-dragging class', () => {
      draggables[1].classList.add('is-dragging');

      expect(dragDrop.getDraggingElement()).toBe(draggables[1]);
    });
  });

  describe('getDraggableElements', () => {
    it('excludes the dragging element', () => {
      draggables[1].classList.add('is-dragging');

      expect(dragDrop.getDraggableElements()).toEqual([draggables[0], draggables[2]]);
    });
  });

  describe('drag lifecycle', () => {
    it('toggles is-dragging on dragstart and dragend', () => {
      draggables[0].dispatchEvent(createDragEvent('dragstart', 10));
      expect(draggables[0].classList.contains('is-dragging')).toBe(true);

      draggables[0].dispatchEvent(createDragEvent('dragend', 10));
      expect(draggables[0].classList.contains('is-dragging')).toBe(false);
      expect(onDrop).toHaveBeenCalled();
    });
  });

  describe('reorder logic', () => {
    it('moves dragged element to the end when dropped past all items', () => {
      const item0 = draggables[0];
      item0.dispatchEvent(createDragEvent('dragstart', 10));

      dropzone.dispatchEvent(createDragEvent('dragover', 500));

      expect(dropzone.lastElementChild).toBe(item0);
      expect(dragDrop.result.order[dragDrop.result.order.length - 1]).toBe(item0);
    });

    it('inserts dragged element before the closest after element', () => {
      const item2 = draggables[2];
      item2.dispatchEvent(createDragEvent('dragstart', 220));

      dropzone.dispatchEvent(createDragEvent('dragover', 5));

      expect(dropzone.children[0]).toBe(item2);
      expect(dragDrop.result.order[0]).toBe(item2);
    });

    it('ignores dragover when dataTransfer contains non-element items', () => {
      const dataTransfer = {
        items: [{ kind: 'file' }],
      } as unknown as DataTransfer;
      draggables[0].dispatchEvent(createDragEvent('dragstart', 10));
      const appendSpy = jest.spyOn(dropzone, 'appendChild');

      dropzone.dispatchEvent(createDragEvent('dragover', 500, dataTransfer));

      expect(appendSpy).not.toHaveBeenCalled();
      appendSpy.mockRestore();
    });
  });
});
