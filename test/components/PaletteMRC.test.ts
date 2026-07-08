import { jest } from '@jest/globals';
import { createMockMarkdownPostProcessorContext } from '_mocks_/mockMarkdownPostProcessorContext';
import { PaletteMRC } from 'src/components/PaletteMRC';
import ColorPalette from 'src/main';
import { ColorPaletteSettings, defaultSettings } from 'src/settings';
import { PaletteSettings, Status } from 'src/components/Palette';
import { setupMockPaletteConstructor, getMockPaletteConstructor } from '_mocks_/mockPaletteConstructor';
import { EventEmitter } from 'src/utils/EventEmitter';
import { createMockPalette } from '_mocks_/mockPalette';
import validateColor from 'validate-color';
import { parseUrl } from 'src/utils/basicUtils';
import { PaletteMenu } from 'src/components/PaletteMenu';

jest.mock('src/main', () => ({
  __esModule: true,
  default: class MockColorPalette {
    settings: ColorPaletteSettings = { ...defaultSettings };
    app: any = {
      workspace: {
        getActiveViewOfType: jest.fn(() => null),
      },
      metadataCache: {
        getFirstLinkpathDest: jest.fn((linkpath: string) => {
          if (linkpath && linkpath.trim().length > 0) {
            return { path: linkpath, name: linkpath };
          }
          return null;
        }),
        getFileCache: jest.fn((tFile: any) => {
          if (tFile) {
            return {
              frontmatter: {
                Color: '#ff0000',
                Name: 'Mock Alias',
              },
            };
          }
          return null;
        }),
      },
    };
    palettes: any[] = [];
  },
  urlRegex: /(?:https?:\/\/)?[a-zA-Z0-9]+\.[a-zA-Z0-9]+/,
}));

jest.mock('src/components/PaletteMenu', () => ({
  PaletteMenu: jest.fn().mockImplementation(function (this: any) {
    this.showAtMouseEvent = jest.fn();
  }),
}));

jest.mock('src/components/Palette', () => {
  const actual = jest.requireActual('src/components/Palette') as typeof import('src/components/Palette');
  return {
    ...actual,
    Palette: jest.fn(),
  };
});

jest.mock('src/utils/basicUtils', () => {
  const actual = jest.requireActual('src/utils/basicUtils') as typeof import('src/utils/basicUtils');
  return {
    ...actual,
    createPaletteBlock: jest.fn((obj) => JSON.stringify(obj)),
    getModifiedSettings: jest.fn((s) => s),
    parseUrl: jest.fn(() => ['#ffffff', '#000000']),
  };
});

jest.mock('validate-color', () => ({
  __esModule: true,
  default: jest.fn(() => true),
}));

function createPalettesArray() {
  const palettes: any[] = [];
  palettes.remove = (item: unknown) => {
    const index = palettes.indexOf(item);
    if (index > -1) palettes.splice(index, 1);
  };
  return palettes;
}

type MockPlugin = {
  settings: ColorPaletteSettings;
  app: {
    workspace: {
      getActiveViewOfType: jest.Mock<
        () => null | { editor: { getRange?: jest.Mock; replaceRange?: jest.Mock } }
      >;
    };
    metadataCache: {
      getFirstLinkpathDest: jest.Mock;
      getFileCache: jest.Mock;
    };
  };
  palettes: ReturnType<typeof createPalettesArray>;
};

function createMockPlugin(overrides: Partial<MockPlugin> = {}): MockPlugin {
  return {
    settings: { ...defaultSettings },
    app: {
      workspace: {
        getActiveViewOfType: jest.fn(() => null),
      },
      metadataCache: {
        getFirstLinkpathDest: jest.fn((linkpath: string) => {
          if (linkpath && linkpath.trim().length > 0) {
            return { path: linkpath, name: linkpath };
          }
          return null;
        }),
        getFileCache: jest.fn((tFile: unknown) => {
          if (tFile) {
            return {
              frontmatter: {
                Color: '#ff0000',
                Name: 'Mock Alias',
              },
            };
          }
          return null;
        }),
      },
    },
    palettes: createPalettesArray(),
    ...overrides,
  };
}

function createPaletteMRC(
  plugin: MockPlugin,
  containerEl: HTMLElement,
  input: string,
  context: ReturnType<typeof createMockMarkdownPostProcessorContext>
) {
  return new PaletteMRC(plugin as unknown as ColorPalette, containerEl, input, context);
}

function setupPaletteConstructorWithEmitter() {
  setupMockPaletteConstructor();
  const mockPaletteConstructor = getMockPaletteConstructor();
  mockPaletteConstructor.mockImplementation((colors, _settings, containerEl, _pluginSettings) => {
    const emitter = new EventEmitter<{ changed: [string[], PaletteSettings]; editMode: [boolean] }>();
    return createMockPalette({
      colors: Array.isArray(colors) ? colors : [],
      containerEl: containerEl as HTMLElement,
      status: Status.VALID,
      emitter,
      setEditMode: jest.fn(),
      reload: jest.fn(),
    });
  });
}

describe('PaletteMRC', () => {
  let mockPlugin: MockPlugin;
  let mockContainerEl: HTMLElement;
  let mockInput: string;
  let mockContext: ReturnType<typeof createMockMarkdownPostProcessorContext>;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(validateColor).mockReturnValue(true);
    setupPaletteConstructorWithEmitter();
    mockPlugin = createMockPlugin();
    mockContainerEl = document.createElement('div');
    mockInput = '#ff0000\n#00ff00\n#0000ff';
    mockContext = createMockMarkdownPostProcessorContext();
  });

  describe('PaletteMRC Constructor & Properties', () => {
    it('should instantiate correctly with provided arguments', () => {
      const paletteMrc = createPaletteMRC(mockPlugin, mockContainerEl, mockInput, mockContext);

      expect(paletteMrc.plugin).toBe(mockPlugin);
      expect(paletteMrc.input).toBe(mockInput);
      expect(paletteMrc.context).toBe(mockContext);
      expect(paletteMrc.containerEl).toBeDefined();
    });

    it('should set containerEl to the provided element', () => {
      const paletteMrc = createPaletteMRC(mockPlugin, mockContainerEl, mockInput, mockContext);

      expect(paletteMrc.containerEl).toBe(mockContainerEl);
    });

    it('should set pluginSettings from plugin.settings', () => {
      const paletteMrc = createPaletteMRC(mockPlugin, mockContainerEl, mockInput, mockContext);

      expect(paletteMrc.pluginSettings).toBe(mockPlugin.settings);
    });

    it('should initialize with correct wikiLinkTestRegex pattern', () => {
      const paletteMrc = createPaletteMRC(mockPlugin, mockContainerEl, mockInput, mockContext);

      expect(paletteMrc.wikiLinkTestRegex).toBeDefined();
      expect(paletteMrc.wikiLinkTestRegex.test('[[test]]')).toBe(true);
    });

    it('should create palette after onload', () => {
      const paletteMrc = createPaletteMRC(mockPlugin, mockContainerEl, mockInput, mockContext);

      expect(paletteMrc.palette).toBeUndefined();

      paletteMrc.onload();

      expect(paletteMrc.palette).toBeDefined();
      expect(mockPlugin.palettes).toContain(paletteMrc);
    });
  });

  describe('Direct color input', () => {
    it('passes multiline hex colors to Palette without metadata lookup', () => {
      const paletteMrc = createPaletteMRC(
        mockPlugin,
        mockContainerEl,
        '#ff0000\n#00ff00\n#0000ff',
        mockContext
      );
      paletteMrc.update();

      const mockPaletteConstructor = getMockPaletteConstructor();
      expect(mockPaletteConstructor).toHaveBeenCalled();
      expect(mockPaletteConstructor.mock.calls[0][0]).toEqual(['#ff0000', '#00ff00', '#0000ff']);
      expect(mockPlugin.app.metadataCache.getFirstLinkpathDest).not.toHaveBeenCalled();
      expect(paletteMrc.palette.colors).toEqual(['#ff0000', '#00ff00', '#0000ff']);
    });

    it('splits comma-delimited colors on one line', () => {
      const paletteMrc = createPaletteMRC(
        mockPlugin,
        mockContainerEl,
        '#ff0000, #00ff00, #0000ff',
        mockContext
      );
      paletteMrc.update();

      expect(getMockPaletteConstructor().mock.calls[0][0]).toEqual(['#ff0000', '#00ff00', '#0000ff']);
    });

    it('splits semicolon-delimited rgb colors', () => {
      const paletteMrc = createPaletteMRC(
        mockPlugin,
        mockContainerEl,
        'rgb(255, 0, 0); rgb(0, 255, 0)',
        mockContext
      );
      paletteMrc.update();

      expect(getMockPaletteConstructor().mock.calls[0][0]).toEqual(['rgb(255, 0, 0)', 'rgb(0, 255, 0)']);
    });
  });

  describe('parseSettings', () => {
    it('parses JSON settings from the last input line', () => {
      const paletteMrc = createPaletteMRC(
        mockPlugin,
        mockContainerEl,
        '#ff0000\n{"height": 200, "width": 400}',
        mockContext
      );
      paletteMrc.update();

      const settings = getMockPaletteConstructor().mock.calls[0][1] as Partial<PaletteSettings>;
      expect(settings).toEqual(expect.objectContaining({ height: 200, width: 400 }));
    });

    it('falls back to plugin defaults when settings JSON is malformed', () => {
      const paletteMrc = createPaletteMRC(
        mockPlugin,
        mockContainerEl,
        '#ff0000\n{not valid json',
        mockContext
      );
      paletteMrc.update();

      const settings = getMockPaletteConstructor().mock.calls[0][1] as Partial<PaletteSettings>;
      expect(settings.height).toBe(defaultSettings.height);
      expect(settings.width).toBe(defaultSettings.width);
    });
  });

  describe('parseColors validation', () => {
    it('returns INVALID_COLORS when validation fails and override is false', () => {
      jest.mocked(validateColor).mockImplementation((color) => color !== 'not-a-color');

      const paletteMrc = createPaletteMRC(
        mockPlugin,
        mockContainerEl,
        'not-a-color',
        mockContext
      );
      paletteMrc.update();

      expect(getMockPaletteConstructor().mock.calls[0][0]).toBe(Status.INVALID_COLORS);
    });

    it('allows invalid colors when override is true in settings', () => {
      jest.mocked(validateColor).mockReturnValue(false);

      const paletteMrc = createPaletteMRC(
        mockPlugin,
        mockContainerEl,
        'not-a-color\n{"override": true}',
        mockContext
      );
      paletteMrc.update();

      expect(getMockPaletteConstructor().mock.calls[0][0]).toEqual(['not-a-color']);
    });
  });

  describe('URL color extraction', () => {
    it('calls parseUrl for URL-like color entries', () => {
      const paletteMrc = createPaletteMRC(
        mockPlugin,
        mockContainerEl,
        'coolors.co/palette/test',
        mockContext
      );
      paletteMrc.update();

      expect(parseUrl).toHaveBeenCalledWith('coolors.co/palette/test');
      expect(paletteMrc.palette.colors).toEqual(['#ffffff', '#000000']);
    });
  });

  describe('Internal Links', () => {
    const internalLinkTestCases = [
      { input: '[[Three laws of motion]]', valid: true, extractedFile: 'Three laws of motion' },
      { input: '[[Three laws of motion.md]]', valid: true, extractedFile: 'Three laws of motion' },
      { input: '[Three laws of motion](Three % 20laws % 20of % 20motion)', valid: true, extractedFile: 'Three laws of motion' },
      { input: '[Three laws of motion](Three % 20laws % 20of % 20motion.md)', valid: true, extractedFile: 'Three laws of motion' },
      { input: '[[About Obsidian#Links are first - class citizens]]', valid: true, extractedFile: 'About Obsidian' },
      { input: '[[Help and support#Questions and advice#Report bugs and request features]]', valid: true, extractedFile: 'Help and support' },
      { input: '[[2023-01-01# ^ 37066d]]', valid: true, extractedFile: '2023-01-01' },
      { input: '[[Example | Custom name]]', valid: true, extractedFile: 'Example' },
      { input: '[Custom name](Example.md)', valid: true, extractedFile: 'Example.md' },
      { input: '[Section name](Example.md#Details)', valid: true, extractedFile: 'Example.md' },
    ];

    test.each(internalLinkTestCases)('$input', ({ input, valid, extractedFile }) => {
      const paletteMrc = createPaletteMRC(mockPlugin, mockContainerEl, input, mockContext);
      paletteMrc.update();

      expect(paletteMrc.wikiLinkTestRegex.test(input)).toBe(valid);
      expect(getMockPaletteConstructor()).toHaveBeenCalled();
      expect(mockPlugin.app.metadataCache.getFirstLinkpathDest)
        .toHaveBeenCalledWith(extractedFile, mockContext.sourcePath);
      expect(paletteMrc.palette.colors).toHaveLength(valid ? 1 : 0);
      expect(paletteMrc.palette.colors).toEqual(['#ff0000']);
    });

    it('handles null file resolution', () => {
      mockPlugin.app.metadataCache.getFirstLinkpathDest.mockReturnValue(null);

      const paletteMrc = createPaletteMRC(mockPlugin, mockContainerEl, '[[Non-existent file]]', mockContext);
      paletteMrc.update();

      expect(paletteMrc.palette.colors).toEqual(['[[Non-existent file]]']);
    });

    it('handles missing frontmatter', () => {
      mockPlugin.app.metadataCache.getFileCache.mockImplementation((tFile: any) => {
        if (tFile) return { frontmatter: null };
        return null;
      });

      const paletteMrc = createPaletteMRC(mockPlugin, mockContainerEl, '[[Some file]]', mockContext);
      paletteMrc.update();

      expect(paletteMrc.palette.colors).toEqual(['[[Some file]]']);
    });

    it('handles file without color property in frontmatter', () => {
      mockPlugin.app.metadataCache.getFileCache.mockImplementation((tFile: any) => {
        if (tFile) {
          return {
            frontmatter: {
              Name: 'Mock Alias',
            },
          };
        }
        return null;
      });

      const paletteMrc = createPaletteMRC(mockPlugin, mockContainerEl, '[[Some file]]', mockContext);
      paletteMrc.update();

      expect(paletteMrc.palette.colors).toEqual([null]);
    });
  });

  describe('Lifecycle and events', () => {
    it('unloads palette and removes itself from plugin.palettes', () => {
      const paletteMrc = createPaletteMRC(mockPlugin, mockContainerEl, mockInput, mockContext);
      paletteMrc.onload();

      paletteMrc.unload();

      expect(paletteMrc.palette.unload).toHaveBeenCalled();
      expect(mockPlugin.palettes).not.toContain(paletteMrc);
    });

    it('tracks editModeChanges when palette emits changed', () => {
      const paletteMrc = createPaletteMRC(mockPlugin, mockContainerEl, mockInput, mockContext);
      paletteMrc.update();

      paletteMrc.palette.emitter.emit('changed', ['#111111'], { height: 100 } as PaletteSettings);

      expect(paletteMrc.editModeChanges).toEqual({
        colors: ['#111111'],
        settings: { height: 100 },
      });
    });

    it('shows PaletteMenu on contextmenu when palette is valid', () => {
      const paletteMrc = createPaletteMRC(mockPlugin, mockContainerEl, mockInput, mockContext);
      paletteMrc.onload();

      const event = new MouseEvent('contextmenu', { bubbles: true });
      paletteMrc.containerEl.dispatchEvent(event);

      expect(PaletteMenu).toHaveBeenCalled();
    });
  });

  describe('Editor I/O', () => {
    it('getPaletteInput returns editor range when section info is available', () => {
      const mockEditor = {
        getRange: jest.fn(() => '#ff0000\n#00ff00'),
      };
      mockPlugin.app.workspace.getActiveViewOfType.mockReturnValue({ editor: mockEditor });
      mockContext.getSectionInfo.mockReturnValue({ lineStart: 2, lineEnd: 4 });

      const paletteMrc = createPaletteMRC(mockPlugin, mockContainerEl, mockInput, mockContext);
      paletteMrc.onload();

      const result = paletteMrc.getPaletteInput();

      expect(result).toEqual({
        lines: { lineStart: 2, lineEnd: 4 },
        input: '#ff0000\n#00ff00',
      });
      expect(mockEditor.getRange).toHaveBeenCalledWith(
        { line: 2, ch: 0 },
        { line: 5, ch: 0 }
      );
    });

    it('setPaletteInput replaces editor range when section info is available', () => {
      const mockEditor = {
        replaceRange: jest.fn(),
      };
      mockPlugin.app.workspace.getActiveViewOfType.mockReturnValue({ editor: mockEditor });
      mockContext.getSectionInfo.mockReturnValue({ lineStart: 1, lineEnd: 3 });

      const paletteMrc = createPaletteMRC(mockPlugin, mockContainerEl, mockInput, mockContext);
      paletteMrc.onload();

      const result = paletteMrc.setPaletteInput('new palette block');

      expect(mockEditor.replaceRange).toHaveBeenCalledWith(
        'new palette block',
        { line: 1, ch: 0 },
        { line: 4, ch: 0 }
      );
      expect(result).toEqual({ lineStart: 1, lineEnd: 3 });
    });

    it('createNotice is invoked when editor is not ready', () => {
      const paletteMrc = createPaletteMRC(mockPlugin, mockContainerEl, mockInput, mockContext);
      paletteMrc.onload();
      const noticeSpy = jest.spyOn(paletteMrc, 'createNotice');

      paletteMrc.getPaletteInput();

      expect(noticeSpy).toHaveBeenCalledWith('The editor has not fully loaded yet.');
    });
  });
});
