import { EventEmitter } from "../src/utils/EventEmitter";
import { Palette, Status } from "../src/components/Palette";

const createMockEmitter = (): EventEmitter<any> => {
  return {
    on: jest.fn(),
    emit: jest.fn(),
    clear: jest.fn(),
  } as unknown as EventEmitter<any>;
};

export const createMockPalette = (
  overrides?: Partial<Palette>
): Palette => {
  const baseMock: Palette = {
    status: 'VALID' as Status,
    containerEl: document.createElement('div'),
    emitter: createMockEmitter(),
    colors: ['#ff0000'],
    unload: jest.fn(),
  } as unknown as Palette;

  return {
    ...baseMock,
    ...overrides,
  } as Palette;
};
