import { jest } from '@jest/globals';
import { ColorPaletteSettings, defaultSettings, Direction } from 'src/settings';
import { Palette, PaletteSettings, Status } from 'src/components/Palette';
import { createMockPaletteItem } from '_mocks_/mockPaletteItem';
import { PaletteItem } from 'src/components/PaletteItem';
import { Canvas } from 'src/utils/canvasUtils';
import { MockCanvasBuilder } from '_mocks_/utils/mockCanvasUtils';
import { copyToClipboard } from 'src/utils/basicUtils';

/**
 * Mock PaletteItem to avoid complex component initialization during Palette tests
 */
jest.mock('src/components/PaletteItem', () => {
  const actual = jest.requireActual('src/components/PaletteItem') as typeof import('src/components/PaletteItem');
  const { createMockPaletteItem } = jest.requireActual('_mocks_/mockPaletteItem') as typeof import('_mocks_/mockPaletteItem');
  return {
    PaletteItem: jest.fn(function (...args: ConstructorParameters<typeof actual.PaletteItem>) {
      if ((global as any).useRealPaletteItem) {
        return new actual.PaletteItem(...args);
      }
      return createMockPaletteItem();
    }),
  };
});

/**
 * Mock Canvas to avoid canvas/DOM setup during gradient palette tests
 */
jest.mock('src/utils/canvasUtils', () => ({
  Canvas: jest.fn(),
}));

/**
 * Mock copyToClipboard side effects; keep pluginToPaletteSettings real for merge/fallback tests
 */
jest.mock('src/utils/basicUtils', () => {
  const actual = jest.requireActual('src/utils/basicUtils') as typeof import('src/utils/basicUtils');
  return {
    ...actual,
    copyToClipboard: jest.fn(),
  };
});

describe('A Palette', () => {
  let containerDiv: HTMLElement;
  let testColors: string[];
  let paletteSettings: PaletteSettings;
  let pluginSettings: ColorPaletteSettings;
  let editMode: boolean;

  beforeEach(() => {
    jest.clearAllMocks();

    pluginSettings = { ...defaultSettings };
    paletteSettings = {
      height: 50,
      width: 100,
      direction: Direction.Column,
      gradient: false,
      hover: false,
      hideText: true,
      override: false,
      aliases: [],
    };
    testColors = ['lightBlue', '#CBA', 'rgb(236, 947, 50)'];
    editMode = false;

    containerDiv = document.createElement('div');

    (PaletteItem as jest.Mock).mockImplementation(function (
      ...args: ConstructorParameters<typeof PaletteItem>
    ) {
      const actual = jest.requireActual('src/components/PaletteItem') as typeof import('src/components/PaletteItem');
      if ((global as any).useRealPaletteItem) {
        return new actual.PaletteItem(...args);
      }
      return createMockPaletteItem();
    });
    (Canvas as jest.Mock).mockImplementation(() => new MockCanvasBuilder().build());

    global.ResizeObserver = jest.fn().mockImplementation(() => ({
      observe: jest.fn(),
      unobserve: jest.fn(),
      disconnect: jest.fn(),
    })) as any;
  });

  describe('when constructed', () => {
    it('parameters are assigned', () => {
      const palette = new Palette(testColors, paletteSettings, containerDiv, pluginSettings, editMode);

      expect(palette).toBeTruthy();
      expect(palette.containerEl).toEqual(containerDiv);
      expect(palette.pluginSettings).toEqual(pluginSettings);
      expect(palette.showNotice).toEqual(true);
      expect(palette.getEditMode()).toEqual(editMode);
      expect(palette.emitter).toBeTruthy();
    });

    it('adds the class to the container element', () => {
      new Palette(testColors, paletteSettings, containerDiv, pluginSettings, editMode);

      expect(containerDiv.classList.contains('palette-container')).toBe(true);
    });
  });

  describe('with valid colors and valid settings', () => {
    it('should assign valid colors', () => {
      const palette = new Palette(testColors, paletteSettings, containerDiv, pluginSettings);

      expect(palette.colors).toEqual(testColors);
    });

    it('should assign valid settings', () => {
      const palette = new Palette(testColors, paletteSettings, containerDiv, pluginSettings);

      expect(palette.settings).toEqual(expect.objectContaining({
        height: paletteSettings.height,
        width: paletteSettings.width,
        direction: paletteSettings.direction,
        gradient: paletteSettings.gradient,
        hover: paletteSettings.hover,
        hideText: paletteSettings.hideText,
        override: paletteSettings.override,
        aliases: paletteSettings.aliases,
      }));
    });

    it('should set status to VALID', () => {
      const palette = new Palette(testColors, paletteSettings, containerDiv, pluginSettings);

      expect(palette.status).toBe(Status.VALID);
    });

    it('should merge plugin settings with palette settings (palette settings take precedence)', () => {
      const customPaletteSettings: PaletteSettings = {
        height: 75,
        width: 200,
        direction: Direction.Row,
        gradient: true,
        hover: true,
        hideText: false,
        override: true,
        aliases: ['red', 'blue'],
      };

      const palette = new Palette(testColors, customPaletteSettings, containerDiv, pluginSettings);

      expect(palette.settings.height).toBe(75);
      expect(palette.settings.width).toBe(200);
      expect(palette.settings.direction).toBe(Direction.Row);
      expect(palette.settings.gradient).toBe(true);
      expect(palette.settings.hover).toBe(true);
      expect(palette.settings.hideText).toBe(false);
      expect(palette.settings.override).toBe(true);
      expect(palette.settings.aliases).toEqual(['red', 'blue']);
    });
  });

  describe('with invalid colors (as string)', () => {
    it('should set colors to empty array', () => {
      const palette = new Palette(Status.INVALID_COLORS, paletteSettings, containerDiv, pluginSettings);

      expect(palette.colors).toEqual([]);
    });

    it('should set status to INVALID_COLORS when only colors are invalid', () => {
      const palette = new Palette(Status.INVALID_COLORS, paletteSettings, containerDiv, pluginSettings);

      expect(palette.status).toBe(Status.INVALID_COLORS);
    });

    it('should set status to INVALID_COLORS_AND_SETTINGS when both colors and settings are invalid', () => {
      const palette = new Palette(Status.INVALID_COLORS, Status.INVALID_SETTINGS, containerDiv, pluginSettings);

      expect(palette.status).toBe(Status.INVALID_COLORS_AND_SETTINGS);
    });

    it('should use fallback settings from pluginSettings', () => {
      const palette = new Palette(Status.INVALID_COLORS, paletteSettings, containerDiv, pluginSettings);

      expect(palette.settings).toBeDefined();
      expect(palette.settings.height).toBe(paletteSettings.height);
      expect(palette.settings.width).toBe(paletteSettings.width);
    });
  });

  describe('with invalid settings (as string)', () => {
    it('should fall back to pluginSettings converted to PaletteSettings', () => {
      const palette = new Palette(testColors, Status.INVALID_SETTINGS, containerDiv, pluginSettings);

      expect(palette.settings).toBeDefined();
      expect(palette.settings.height).toBe(pluginSettings.height);
      expect(palette.settings.width).toBe(pluginSettings.width);
      expect(palette.settings.direction).toBe(pluginSettings.direction);
    });

    it('should set status to INVALID_SETTINGS', () => {
      const palette = new Palette(testColors, Status.INVALID_SETTINGS, containerDiv, pluginSettings);

      expect(palette.status).toBe(Status.INVALID_SETTINGS);
    });

    it('should not override colors with invalid settings', () => {
      const palette = new Palette(testColors, Status.INVALID_SETTINGS, containerDiv, pluginSettings);

      expect(palette.colors).toEqual(testColors);
    });

    it('should have colors but invalid settings status', () => {
      const palette = new Palette(testColors, Status.INVALID_SETTINGS, containerDiv, pluginSettings);

      expect(palette.colors.length).toBeGreaterThan(0);
      expect(palette.status).toBe(Status.INVALID_SETTINGS);
    });
  });

  describe('with undefined settings', () => {
    it('should fall back to pluginSettings converted to PaletteSettings', () => {
      const palette = new Palette(testColors, undefined, containerDiv, pluginSettings);

      expect(palette.settings).toBeDefined();
      expect(palette.settings.height).toBe(pluginSettings.height);
      expect(palette.settings.width).toBe(pluginSettings.width);
      expect(palette.settings.direction).toBe(pluginSettings.direction);
      expect(palette.settings.gradient).toBe(pluginSettings.gradient);
    });

    it('should set status to VALID when colors are valid and settings are undefined', () => {
      const palette = new Palette(testColors, undefined, containerDiv, pluginSettings);

      expect(palette.status).toBe(Status.VALID);
    });

    it('should assign valid colors when settings are undefined', () => {
      const palette = new Palette(testColors, undefined, containerDiv, pluginSettings);

      expect(palette.colors).toEqual(testColors);
    });

    it('should include aliases array from fallback settings', () => {
      const palette = new Palette(testColors, undefined, containerDiv, pluginSettings);

      expect(palette.settings.aliases).toBeDefined();
      expect(Array.isArray(palette.settings.aliases)).toBe(true);
    });
  });

  describe('with both colors and settings invalid', () => {
    it('should set colors to empty array', () => {
      const palette = new Palette(Status.INVALID_COLORS, Status.INVALID_SETTINGS, containerDiv, pluginSettings);

      expect(palette.colors).toEqual([]);
    });

    it('should fall back to pluginSettings for settings', () => {
      const palette = new Palette(Status.INVALID_COLORS, Status.INVALID_SETTINGS, containerDiv, pluginSettings);

      expect(palette.settings.height).toBe(pluginSettings.height);
      expect(palette.settings.width).toBe(pluginSettings.width);
    });

    it('should set status to INVALID_COLORS_AND_SETTINGS', () => {
      const palette = new Palette(Status.INVALID_COLORS, Status.INVALID_SETTINGS, containerDiv, pluginSettings);

      expect(palette.status).toBe(Status.INVALID_COLORS_AND_SETTINGS);
    });
  });

  describe('with various color formats', () => {
    it('should accept named colors', () => {
      const namedColors = ['red', 'blue', 'green'];
      const palette = new Palette(namedColors, paletteSettings, containerDiv, pluginSettings);

      expect(palette.colors).toEqual(namedColors);
    });

    it('should accept hex colors', () => {
      const hexColors = ['#FF0000', '#00FF00', '#0000FF'];
      const palette = new Palette(hexColors, paletteSettings, containerDiv, pluginSettings);

      expect(palette.colors).toEqual(hexColors);
    });

    it('should accept rgb colors', () => {
      const rgbColors = ['rgb(255, 0, 0)', 'rgb(0, 255, 0)', 'rgb(0, 0, 255)'];
      const palette = new Palette(rgbColors, paletteSettings, containerDiv, pluginSettings);

      expect(palette.colors).toEqual(rgbColors);
    });

    it('should accept mixed color formats', () => {
      const mixedColors = ['red', '#00FF00', 'rgb(0, 0, 255)'];
      const palette = new Palette(mixedColors, paletteSettings, containerDiv, pluginSettings);

      expect(palette.colors).toEqual(mixedColors);
    });

    it('should accept empty color array', () => {
      const emptyColors: string[] = [];
      const palette = new Palette(emptyColors, paletteSettings, containerDiv, pluginSettings);

      expect(palette.colors).toEqual([]);
    });

    it('should accept single color', () => {
      const singleColor = ['#FFFFFF'];
      const palette = new Palette(singleColor, paletteSettings, containerDiv, pluginSettings);

      expect(palette.colors).toEqual(singleColor);
    });
  });

  describe('settings merging behavior', () => {
    it('should preserve all palette settings properties when merging', () => {
      const customSettings: PaletteSettings = {
        height: 100,
        width: 150,
        direction: Direction.Row,
        gradient: true,
        hover: true,
        hideText: false,
        override: true,
        aliases: ['primary', 'secondary'],
      };

      const palette = new Palette(testColors, customSettings, containerDiv, pluginSettings);

      expect(Object.keys(palette.settings)).toContain('height');
      expect(Object.keys(palette.settings)).toContain('width');
      expect(Object.keys(palette.settings)).toContain('direction');
      expect(Object.keys(palette.settings)).toContain('gradient');
      expect(Object.keys(palette.settings)).toContain('hover');
      expect(Object.keys(palette.settings)).toContain('hideText');
      expect(Object.keys(palette.settings)).toContain('override');
      expect(Object.keys(palette.settings)).toContain('aliases');
    });

    it('should handle partial palette settings overrides', () => {
      const partialSettings: Partial<PaletteSettings> = {
        height: 75,
        width: 200,
      };

      const palette = new Palette(testColors, partialSettings as PaletteSettings, containerDiv, pluginSettings);

      expect(palette.settings.height).toBe(75);
      expect(palette.settings.width).toBe(200);
      expect(palette.settings.direction).toBeDefined();
    });

    it('should preserve plugin settings for properties not in palette settings', () => {
      const minimalSettings: PaletteSettings = {
        height: 60,
        width: 120,
        direction: Direction.Row,
        gradient: false,
        hover: false,
        hideText: false,
        override: false,
        aliases: [],
      };

      const palette = new Palette(testColors, minimalSettings, containerDiv, pluginSettings);

      expect(palette.settings.height).toBe(minimalSettings.height);
      expect(palette.settings.width).toBe(minimalSettings.width);
    });
  });

  describe('edge cases', () => {
    it('should handle calling setDefaults multiple times', () => {
      const palette = new Palette(testColors, paletteSettings, containerDiv, pluginSettings);
      const newColors = ['#111111', '#222222'];
      const newSettings: PaletteSettings = {
        height: 80,
        width: 160,
        direction: Direction.Row,
        gradient: true,
        hover: true,
        hideText: true,
        override: false,
        aliases: [],
      };

      palette.setDefaults(newColors, newSettings);

      expect(palette.colors).toEqual(newColors);
      expect(palette.settings.height).toBe(80);
      expect(palette.settings.direction).toBe(Direction.Row);
    });

    it('should handle switching from valid to invalid state', () => {
      const palette = new Palette(testColors, paletteSettings, containerDiv, pluginSettings);
      expect(palette.status).toBe(Status.VALID);

      palette.setDefaults(Status.INVALID_COLORS, Status.INVALID_SETTINGS);

      expect(palette.status).toBe(Status.INVALID_COLORS_AND_SETTINGS);
      expect(palette.colors).toEqual([]);
    });

    it('should handle very large color arrays', () => {
      const largeColorArray = Array(1000).fill('#FF0000').map((color, i) => `hsl(${i}, 100%, 50%)`);
      const palette = new Palette(largeColorArray, paletteSettings, containerDiv, pluginSettings);

      expect(palette.colors).toEqual(largeColorArray);
      expect(palette.colors.length).toBe(1000);
    });

    it('should handle empty aliases array in settings', () => {
      const settingsWithEmptyAliases: PaletteSettings = {
        ...paletteSettings,
        aliases: [],
      };

      const palette = new Palette(testColors, settingsWithEmptyAliases, containerDiv, pluginSettings);

      expect(palette.settings.aliases).toEqual([]);
    });

    it('should handle aliases array with same length as colors', () => {
      const settingsWithAliases: PaletteSettings = {
        ...paletteSettings,
        aliases: ['primary', 'secondary', 'tertiary'],
      };

      const palette = new Palette(testColors, settingsWithAliases, containerDiv, pluginSettings);

      expect(palette.settings.aliases.length).toBe(palette.colors.length);
      expect(palette.settings.aliases).toEqual(['primary', 'secondary', 'tertiary']);
    });

    it('should handle aliases array longer than colors array', () => {
      const settingsWithExtraAliases: PaletteSettings = {
        ...paletteSettings,
        aliases: ['primary', 'secondary', 'tertiary', 'extra'],
      };

      const palette = new Palette(testColors, settingsWithExtraAliases, containerDiv, pluginSettings);

      expect(palette.settings.aliases.length).toBe(4);
    });
  });

  describe('lifecycle and rendering', () => {
    beforeEach(() => {
      (global as any).useRealPaletteItem = false;
    });

    afterEach(() => {
      (global as any).useRealPaletteItem = false;
    });

    it('renders invalid palette UI when colors are invalid', () => {
      const palette = new Palette(Status.INVALID_COLORS, paletteSettings, containerDiv, pluginSettings);

      const invalidSection = containerDiv.querySelector('section.invalid');
      expect(invalidSection).toBeTruthy();
      expect(invalidSection?.textContent).toContain(Status.INVALID_COLORS);
    });

    it('renders INVALID_GRADIENT when gradient palette has one color', () => {
      const gradientSettings: PaletteSettings = {
        ...paletteSettings,
        gradient: true,
      };

      new Palette(['#ff0000'], gradientSettings, containerDiv, pluginSettings);

      const invalidSection = containerDiv.querySelector('section.invalid');
      expect(invalidSection?.textContent).toContain(Status.INVALID_GRADIENT);
    });

    it('creates Canvas for gradient palettes with multiple colors', () => {
      const gradientSettings: PaletteSettings = {
        ...paletteSettings,
        gradient: true,
      };

      new Palette(['#ff0000', '#00ff00'], gradientSettings, containerDiv, pluginSettings);

      expect(Canvas).toHaveBeenCalled();
    });

    it('reload rebuilds palette contents', () => {
      const palette = new Palette(['#ff0000', '#00ff00'], paletteSettings, containerDiv, pluginSettings);
      const initialDropzone = palette.dropzone;

      palette.reload();

      expect(palette.dropzone).toBeDefined();
      expect(palette.dropzone.classList.contains('palette')).toBe(true);
      expect(palette.paletteItems.length).toBe(2);
      expect(initialDropzone).not.toBe(palette.dropzone);
    });

    it('setEditMode emits editMode event', () => {
      const palette = new Palette(testColors, paletteSettings, containerDiv, pluginSettings);
      const handler = jest.fn();
      palette.emitter.on('editMode', handler);

      palette.setEditMode(true);

      expect(handler).toHaveBeenCalledWith(true);
      expect(palette.getEditMode()).toBe(true);
    });

    it('adds edit-mode class to dropzone when constructed in edit mode', () => {
      const palette = new Palette(testColors, paletteSettings, containerDiv, pluginSettings, true);

      expect(palette.dropzone.classList.contains('edit-mode')).toBe(true);
    });

    it('getPaletteWidth prefers user width when above default', () => {
      const wideSettings: PaletteSettings = {
        ...paletteSettings,
        width: defaultSettings.width + 100,
      };
      const palette = new Palette(testColors, wideSettings, containerDiv, pluginSettings);

      expect(palette.getPaletteWidth()).toBe(wideSettings.width);
    });

    it('getPaletteWidth uses resize offset when smaller than settings width', () => {
      const palette = new Palette(testColors, paletteSettings, containerDiv, pluginSettings);

      expect(palette.getPaletteWidth(50)).toBe(50);
    });

    it('getPaletteWidth falls back to settings width', () => {
      const palette = new Palette(testColors, paletteSettings, containerDiv, pluginSettings);
      Object.defineProperty(palette.dropzone, 'offsetWidth', { configurable: true, value: 0 });

      expect(palette.getPaletteWidth()).toBe(paletteSettings.width);
    });

    it('unload clears palette items and container children', () => {
      const palette = new Palette(testColors, paletteSettings, containerDiv, pluginSettings);
      const mockItem = createMockPaletteItem();
      palette.paletteItems = [mockItem];

      palette.unload();

      expect(mockItem.unload).toHaveBeenCalled();
      expect(palette.paletteItems).toEqual([]);
      expect(containerDiv.innerHTML).toBe('');
    });
  });

  describe('edit mode integration', () => {
    beforeEach(() => {
      (global as any).useRealPaletteItem = true;
      jest.mocked(copyToClipboard).mockResolvedValue(undefined);
    });

    afterEach(() => {
      (global as any).useRealPaletteItem = false;
    });

    it('removes a color and emits changed when trash is triggered in edit mode', () => {
      const palette = new Palette(
        ['#ff0000', '#00ff00'],
        paletteSettings,
        containerDiv,
        pluginSettings,
        true
      );
      const changedHandler = jest.fn();
      palette.emitter.on('changed', changedHandler);

      palette.paletteItems[0].emitter.emit('trash', new MouseEvent('click'));

      expect(palette.colors).toEqual(['#00ff00']);
      expect(changedHandler).toHaveBeenCalled();
    });
  });
});
