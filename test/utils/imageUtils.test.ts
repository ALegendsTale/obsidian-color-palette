import { jest } from '@jest/globals';
import quantize from 'quantize';
import CanvasImage from 'src/utils/imageUtils';

jest.mock('quantize', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    palette: () => [[255, 0, 0], [0, 255, 0], [0, 0, 255]],
  })),
}));

describe('CanvasImage', () => {
  let container: HTMLElement;

  beforeEach(() => {
    jest.clearAllMocks();
    container = document.createElement('div');
  });

  function markImageLoaded(canvasImage: CanvasImage, width = 400, height = 200) {
    Object.defineProperty(canvasImage.image, 'naturalWidth', { value: width, configurable: true });
    Object.defineProperty(canvasImage.image, 'naturalHeight', { value: height, configurable: true });
    (canvasImage as any).loading = false;
  }

  describe('when constructed', () => {
    it('sets crossOrigin on the image', () => {
      const canvasImage = new CanvasImage(container);

      expect(canvasImage.image.crossOrigin).toBe('anonymous');
    });

    it('adds image class to canvas', () => {
      const canvasImage = new CanvasImage(container);

      expect(canvasImage.canvas.classList.contains('image')).toBe(true);
    });

    it('respects the smoothing constructor flag', () => {
      const canvasImage = new CanvasImage(container, undefined, true);

      expect(canvasImage.context.imageSmoothingEnabled).toBe(true);
    });

    it('sets loading to false when the image loads', () => {
      const canvasImage = new CanvasImage(container);

      expect((canvasImage as any).loading).toBe(true);
      canvasImage.image.dispatchEvent(new Event('load'));
      expect((canvasImage as any).loading).toBe(false);
    });

    it('registers load and error listeners on the image', () => {
      const addSpy = jest.spyOn(HTMLImageElement.prototype, 'addEventListener');
      new CanvasImage(container);

      expect(addSpy).toHaveBeenCalledWith('load', expect.any(Function));
      expect(addSpy).toHaveBeenCalledWith('error', expect.any(Function));
      addSpy.mockRestore();
    });
  });

  async function flushLoading() {
    await new Promise((resolve) => setTimeout(resolve, 150));
  }

  describe('update', () => {
    it('draws image with aspect ratio preserved when height fits', async () => {
      const canvasImage = new CanvasImage(container);
      const drawImageSpy = jest.spyOn(canvasImage.context, 'drawImage');
      markImageLoaded(canvasImage, 400, 200);

      canvasImage.update('https://example.com/image.png', 200, 300);
      markImageLoaded(canvasImage, 400, 200);
      await flushLoading();

      expect(canvasImage.width).toBe(200);
      expect(canvasImage.height).toBe(100);
      expect(drawImageSpy).toHaveBeenCalledWith(canvasImage.image, 0, 0, 200, 100);
    });

    it('clamps dimensions when calculated height exceeds max height', async () => {
      const canvasImage = new CanvasImage(container);
      markImageLoaded(canvasImage, 400, 800);

      canvasImage.update('https://example.com/tall.png', 400, 200);
      markImageLoaded(canvasImage, 400, 800);
      await flushLoading();

      expect(canvasImage.height).toBe(200);
      expect(canvasImage.width).toBe(100);
    });
  });

  describe('createPixelArray', () => {
    it('filters near-white and low-alpha pixels', async () => {
      const canvasImage = new CanvasImage(container);
      canvasImage.width = 2;
      canvasImage.height = 2;
      markImageLoaded(canvasImage);

      const pixelData = new Uint8ClampedArray([
        255, 255, 255, 255,
        255, 0, 0, 255,
        0, 255, 0, 100,
        0, 0, 255, 255,
      ]);
      jest.spyOn(canvasImage.context, 'getImageData').mockReturnValue({ data: pixelData } as ImageData);

      const pixels = await canvasImage.createPixelArray(1);

      expect(pixels).toEqual([[255, 0, 0], [0, 0, 255]]);
    });

    it('respects quality stride when sampling pixels', async () => {
      const canvasImage = new CanvasImage(container);
      canvasImage.width = 4;
      canvasImage.height = 1;
      markImageLoaded(canvasImage);

      const pixelData = new Uint8ClampedArray(16);
      for (let i = 0; i < 4; i++) {
        pixelData[i * 4] = i * 50;
        pixelData[i * 4 + 3] = 255;
      }
      jest.spyOn(canvasImage.context, 'getImageData').mockReturnValue({ data: pixelData } as ImageData);

      const pixels = await canvasImage.createPixelArray(2);

      expect(pixels).toHaveLength(2);
    });
  });

  describe('getPalette', () => {
    it('returns quantize palette colors', async () => {
      const canvasImage = new CanvasImage(container);
      canvasImage.width = 1;
      canvasImage.height = 1;
      markImageLoaded(canvasImage);
      jest.spyOn(canvasImage, 'createPixelArray').mockResolvedValue([[255, 0, 0]] as any);

      const palette = await canvasImage.getPalette(5);

      expect(palette).toEqual([[255, 0, 0], [0, 255, 0], [0, 0, 255]]);
    });

    it('returns null when no pixels are available', async () => {
      const canvasImage = new CanvasImage(container);
      markImageLoaded(canvasImage);
      jest.spyOn(canvasImage, 'createPixelArray').mockResolvedValue(null);

      expect(await canvasImage.getPalette()).toBeNull();
    });

    it('uses nColors fix when numColors is greater than 7', async () => {
      const canvasImage = new CanvasImage(container);
      markImageLoaded(canvasImage);
      jest.spyOn(canvasImage, 'createPixelArray').mockResolvedValue([[255, 0, 0]] as any);

      await canvasImage.getPalette(10);

      expect(quantize).toHaveBeenCalledWith([[255, 0, 0]], 11);
    });
  });

  describe('getImageData', () => {
    it('throws wrapped error when context getImageData fails', async () => {
      const canvasImage = new CanvasImage(container);
      canvasImage.width = 10;
      canvasImage.height = 10;
      markImageLoaded(canvasImage);
      jest.spyOn(canvasImage.context, 'getImageData').mockImplementation(() => {
        throw new Error('security error');
      });

      await expect(canvasImage.getImageData()).rejects.toThrow('Failed to get image data.');
    });
  });

  describe('waitForLoading', () => {
    it('resolves after the image load event clears loading', async () => {
      jest.useFakeTimers();
      const canvasImage = new CanvasImage(container);

      const loadingPromise = (canvasImage as any).waitForLoading();
      canvasImage.image.dispatchEvent(new Event('load'));
      jest.advanceTimersByTime(100);

      await expect(loadingPromise).resolves.toBe(true);
      jest.useRealTimers();
    });
  });
});
