import { jest } from '@jest/globals';
import { Direction } from 'src/settings';
import { Canvas } from 'src/utils/canvasUtils';

jest.mock('validate-color', () => ({
  __esModule: true,
  default: jest.fn((color: string) => color.startsWith('#')),
}));

describe('Canvas', () => {
  let container: HTMLElement;
  let canvas: Canvas;

  beforeEach(() => {
    jest.clearAllMocks();
    container = document.createElement('div');
    canvas = new Canvas(container);
  });

  describe('when constructed', () => {
    it('adds palette-canvas class to the container', () => {
      expect(container.classList.contains('palette-canvas')).toBe(true);
    });

    it('creates canvas and tooltip elements', () => {
      expect(canvas.canvas).toBeInstanceOf(HTMLCanvasElement);
      expect(canvas.tooltip).toBeInstanceOf(HTMLElement);
      expect(canvas.tooltipText).toBeInstanceOf(HTMLSpanElement);
    });

    it('creates an emitter', () => {
      expect(canvas.emitter).toBeDefined();
    });
  });

  describe('createGradient', () => {
    it('creates a column gradient from left to right', () => {
      const createLinearGradient = jest.spyOn(canvas.context, 'createLinearGradient');

      canvas.createGradient(['#ff0000', '#00ff00', '#0000ff'], 300, 100, Direction.Column);

      expect(createLinearGradient).toHaveBeenCalledWith(0, 0, 300, 0);
      expect(canvas.canvas.classList.contains('gradient')).toBe(true);
    });

    it('creates a row gradient from top to bottom', () => {
      const createLinearGradient = jest.spyOn(canvas.context, 'createLinearGradient');

      canvas.createGradient(['#ff0000', '#00ff00', '#0000ff'], 300, 100, Direction.Row);

      expect(createLinearGradient).toHaveBeenCalledWith(0, 0, 0, 100);
    });

    it('skips invalid colors', () => {
      const gradient = {
        addColorStop: jest.fn(),
      } as unknown as CanvasGradient;
      jest.spyOn(canvas.context, 'createLinearGradient').mockReturnValue(gradient);

      canvas.createGradient(['not-a-color', '#ff0000', '#00ff00'], 300, 100, Direction.Column);

      expect(gradient.addColorStop).toHaveBeenCalledTimes(2);
    });

    it('throws when there are not enough valid color stops', () => {
      expect(() =>
        canvas.createGradient(['not-a-color', 'also-invalid'], 300, 100, Direction.Column)
      ).toThrow('There are not enough valid color stops to create the gradient.');
    });

    it('sets the palette column flex basis CSS variable', () => {
      canvas.createGradient(['#ff0000', '#00ff00', '#0000ff', '#000000'], 400, 200, Direction.Column);

      expect(canvas.canvas.style.getPropertyValue('--palette-column-flex-basis')).toBe('25px');
    });
  });

  describe('getCanvasHex', () => {
    it('returns hex for opaque pixels', () => {
      jest.spyOn(canvas.context, 'getImageData').mockReturnValue({
        data: new Uint8ClampedArray([255, 0, 0, 255]),
      } as ImageData);
      jest.spyOn(canvas.canvas, 'getBoundingClientRect').mockReturnValue({
        left: 0,
        top: 0,
        width: 100,
        height: 50,
      } as DOMRect);

      expect(canvas.getCanvasHex(10, 10)).toBe('#ff0000');
    });

    it('includes alpha in hex when pixel is not fully opaque', () => {
      jest.spyOn(canvas.context, 'getImageData').mockReturnValue({
        data: new Uint8ClampedArray([255, 0, 0, 128]),
      } as ImageData);
      jest.spyOn(canvas.canvas, 'getBoundingClientRect').mockReturnValue({
        left: 0,
        top: 0,
        width: 100,
        height: 50,
      } as DOMRect);

      expect(canvas.getCanvasHex(10, 10)).toMatch(/^#[0-9a-f]+$/i);
    });
  });

  describe('setTooltipPosition', () => {
    beforeEach(() => {
      jest.spyOn(canvas.canvas, 'getBoundingClientRect').mockReturnValue({
        left: 0,
        top: 0,
        width: 200,
        height: 100,
        right: 200,
        bottom: 100,
      } as DOMRect);
      jest.spyOn(canvas.context, 'getImageData').mockReturnValue({
        data: new Uint8ClampedArray([0, 0, 255, 255]),
      } as ImageData);
      Object.defineProperty(canvas.tooltip, 'offsetWidth', { value: 80, configurable: true });
      Object.defineProperty(canvas.tooltip, 'offsetHeight', { value: 24, configurable: true });
    });

    it('positions the tooltip and sets uppercased hex text', () => {
      const setTextSpy = jest.spyOn(canvas.tooltipText, 'setText');

      canvas.setTooltipPosition(50, 50);

      expect(canvas.tooltip.style.left).toBeTruthy();
      expect(canvas.tooltip.style.top).toBeTruthy();
      expect(setTextSpy).toHaveBeenCalledWith('#0000FF');
    });

    it('clamps tooltip position near canvas edges', () => {
      canvas.setTooltipPosition(5, 2);

      expect(parseFloat(canvas.tooltip.style.top)).toBeGreaterThanOrEqual(0);
    });
  });

  describe('isTouchEnabled', () => {
    it('returns true when ontouchstart exists on window', () => {
      Object.defineProperty(window, 'ontouchstart', { value: true, configurable: true });

      expect(canvas.isTouchEnabled()).toBe(true);

      delete (window as any).ontouchstart;
    });

    it('returns true when navigator.maxTouchPoints is greater than zero', () => {
      Object.defineProperty(navigator, 'maxTouchPoints', { value: 2, configurable: true });

      expect(canvas.isTouchEnabled()).toBe(true);
    });
  });

  describe('click events', () => {
    it('emits click with hex from canvas position', () => {
      const handler = jest.fn();
      canvas.emitter.on('click', handler);
      jest.spyOn(canvas, 'getCanvasHex').mockReturnValue('#aabbcc');
      jest.spyOn(canvas.canvas, 'getBoundingClientRect').mockReturnValue({
        left: 0,
        top: 0,
        width: 100,
        height: 50,
      } as DOMRect);

      canvas.canvas.dispatchEvent(new MouseEvent('click', { clientX: 20, clientY: 10, bubbles: true }));

      expect(handler).toHaveBeenCalledWith('#aabbcc');
    });
  });
});
