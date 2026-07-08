import { jest } from '@jest/globals';
import { createMockPalette } from '_mocks_/mockPalette';
import { Palette } from 'src/components/Palette';

export const setupMockPaletteConstructor = (): void => {
  const mockConstructor = jest.mocked(Palette);
  mockConstructor.mockImplementation((colors, settings, containerEl, pluginSettings) =>
    createMockPalette({
      colors: Array.isArray(colors) ? colors : [],
      containerEl: containerEl as HTMLElement,
    }) as jest.MockedObject<Palette>
  );

  (global as any).mockPaletteConstructor = mockConstructor;
};

export const getMockPaletteConstructor = (): jest.Mock => {
  const constructor = (global as any).mockPaletteConstructor;
  if (!constructor) {
    throw new Error(
      'mockPaletteConstructor not initialized. Did you forget to call setupMockPaletteConstructor() in beforeEach()? ' +
      'Or ensure jest.mock("src/components/Palette", ...) is set up.'
    );
  }
  return constructor;
};
