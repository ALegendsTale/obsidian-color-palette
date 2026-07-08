import { jest } from '@jest/globals';
import { Canvas } from '../../src/utils/canvasUtils';
import { EventEmitter } from "../../src/utils/EventEmitter";

type CanvasEventMap = {
  click: [hex: string],
};

const DEFAULT_WIDTH = 400;
const DEFAULT_HEIGHT = 200;

export type MockCanvasContextOptions = {
  pixelData?: Uint8ClampedArray;
  gradient?: CanvasGradient;
};

export function createMockCanvasContext(options: MockCanvasContextOptions = {}): CanvasRenderingContext2D {
  const gradient = options.gradient ?? {
    addColorStop: jest.fn(),
  } as unknown as CanvasGradient;

  return {
    createLinearGradient: jest.fn(() => gradient),
    fillStyle: '',
    fillRect: jest.fn(),
    drawImage: jest.fn(),
    imageSmoothingEnabled: true,
    getImageData: jest.fn(() => ({
      data: options.pixelData ?? new Uint8ClampedArray([255, 0, 0, 255]),
    })),
  } as unknown as CanvasRenderingContext2D;
}

const createMockCanvasEmitter = (): EventEmitter<CanvasEventMap> => {
  return {
    on: jest.fn(),
    emit: jest.fn(),
    clear: jest.fn(),
  } as unknown as EventEmitter<CanvasEventMap>;
};

export const createMockCanvasElement = (
  width: number = DEFAULT_WIDTH,
  height: number = DEFAULT_HEIGHT,
  contextOptions?: MockCanvasContextOptions
): HTMLCanvasElement => {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const mockContext = createMockCanvasContext(contextOptions);
  canvas.getContext = jest.fn(() => mockContext) as any;

  return canvas;
};

const createMockCanvas = (overrides?: Partial<Canvas>): Canvas => {
  const container = document.createElement('div');
  const canvas = createMockCanvasElement();
  const tooltip = document.createElement('section');
  const tooltipText = document.createElement('span');

  const baseMock: Canvas = {
    container,
    canvas,
    tooltip,
    tooltipText,
    context: canvas.getContext('2d', { willReadFrequently: true, alpha: true })!,
    emitter: createMockCanvasEmitter(),
  } as unknown as Canvas;

  return {
    ...baseMock,
    ...overrides,
  } as Canvas;
};

export class MockCanvasBuilder {
  private mock: Canvas;

  constructor(contextOptions?: MockCanvasContextOptions) {
    const canvasElement = createMockCanvasElement(DEFAULT_WIDTH, DEFAULT_HEIGHT, contextOptions);
    this.mock = createMockCanvas({ canvas: canvasElement });
  }

  build(): Canvas {
    return this.mock;
  }
}
