import { jest } from '@jest/globals';
import { App } from 'obsidian';
import { MenuItem } from '_mocks_/index';
import { PaletteMenu } from 'src/components/PaletteMenu';
import { Palette, PaletteSettings } from 'src/components/Palette';
import { Direction } from 'src/settings';
import { defaultSettings } from 'src/settings';
import { copyToClipboard, createPaletteBlock, getModifiedSettings } from 'src/utils/basicUtils';
import { ReorderModal } from 'src/components/ReorderModal';
import { EditorModal } from 'src/components/EditorModal';

jest.mock('src/components/ReorderModal', () => ({
  ReorderModal: jest.fn().mockImplementation(() => ({
    open: jest.fn(),
    setInstructions: jest.fn(),
    setPlaceholder: jest.fn(),
  })),
}));

jest.mock('src/components/EditorModal', () => ({
  EditorModal: jest.fn().mockImplementation(() => ({
    open: jest.fn(),
  })),
}));

jest.mock('src/utils/basicUtils', () => {
  const actual = jest.requireActual('src/utils/basicUtils') as typeof import('src/utils/basicUtils');
  return {
    ...actual,
    copyToClipboard: jest.fn(),
    createPaletteBlock: jest.fn(() => 'palette-block'),
    getModifiedSettings: jest.fn((s) => s),
  };
});

function createMockPalette(overrides: Partial<Palette> = {}): Palette {
  const settings: PaletteSettings = {
    height: 100,
    width: 200,
    direction: Direction.Column,
    gradient: false,
    hover: false,
    hideText: false,
    override: false,
    aliases: [],
  };

  return {
    colors: ['#ff0000', '#00ff00'],
    settings,
    pluginSettings: defaultSettings,
    containerEl: document.createElement('div'),
    getEditMode: jest.fn(() => false),
    setEditMode: jest.fn(),
    reload: jest.fn(),
    ...overrides,
  } as unknown as Palette;
}

type MenuWithItems = PaletteMenu & {
  items: Array<MenuItem | { separator: true }>;
};

function getMenuItems(menu: PaletteMenu) {
  return (menu as MenuWithItems).items.filter((item): item is MenuItem => !('separator' in item));
}

function getMenuTitles(menu: PaletteMenu) {
  return getMenuItems(menu).map((item) => item.title);
}

describe('PaletteMenu', () => {
  let onChange: jest.Mock;
  let context: { getSectionInfo: jest.Mock };

  beforeEach(() => {
    jest.clearAllMocks();
    onChange = jest.fn();
    context = { getSectionInfo: jest.fn(() => ({ lineStart: 0, lineEnd: 2 })) };
  });

  it('includes Quick Edit for non-gradient column palettes', () => {
    const menu = new PaletteMenu(new App(), context as any, createMockPalette(), onChange);

    expect(getMenuTitles(menu)).toContain('Quick Edit');
  });

  it('omits Quick Edit for gradient palettes', () => {
    const palette = createMockPalette({
      settings: {
        ...createMockPalette().settings,
        gradient: true,
      },
    });

    const menu = new PaletteMenu(new App(), context as any, palette, onChange);

    expect(getMenuTitles(menu)).not.toContain('Quick Edit');
  });

  it('omits Quick Edit for row-direction palettes', () => {
    const palette = createMockPalette({
      settings: {
        ...createMockPalette().settings,
        direction: Direction.Row,
      },
    });

    const menu = new PaletteMenu(new App(), context as any, palette, onChange);

    expect(getMenuTitles(menu)).not.toContain('Quick Edit');
  });

  it('opens ReorderModal when Reorder is clicked', () => {
    const menu = new PaletteMenu(new App(), context as any, createMockPalette(), onChange);
    const reorderItem = getMenuItems(menu).find((item) => item.title === 'Reorder');

    reorderItem?.clickHandler?.();

    expect(ReorderModal).toHaveBeenCalled();
  });

  it('opens EditorModal when Edit Mode is clicked', () => {
    const menu = new PaletteMenu(new App(), context as any, createMockPalette(), onChange);
    const editItem = getMenuItems(menu).find((item) => item.title === 'Edit Mode');

    editItem?.clickHandler?.();

    expect(EditorModal).toHaveBeenCalled();
  });

  it('converts colors to RGB on Convert to RGB click', () => {
    const menu = new PaletteMenu(new App(), context as any, createMockPalette(), onChange);
    const rgbItem = getMenuItems(menu).find((item) => item.title === 'Convert to RGB');

    rgbItem?.clickHandler?.();

    expect(onChange).toHaveBeenCalledWith(
      ['rgb(255, 0, 0)', 'rgb(0, 255, 0)'],
      expect.any(Object)
    );
  });

  it('converts colors to HSL on Convert to HSL click', () => {
    const menu = new PaletteMenu(new App(), context as any, createMockPalette(), onChange);
    const hslItem = getMenuItems(menu).find((item) => item.title === 'Convert to HSL');

    hslItem?.clickHandler?.();

    expect(onChange).toHaveBeenCalledWith(
      expect.arrayContaining([expect.stringMatching(/^hsl\(/)]),
      expect.any(Object)
    );
  });

  it('converts colors to HEX on Convert to HEX click', () => {
    const menu = new PaletteMenu(new App(), context as any, createMockPalette(), onChange);
    const hexItem = getMenuItems(menu).find((item) => item.title === 'Convert to HEX');

    hexItem?.clickHandler?.();

    expect(onChange).toHaveBeenCalledWith(
      ['#ff0000', '#00ff00'],
      expect.any(Object)
    );
  });

  it('cuts palette by copying then clearing via onChange', async () => {
    const menu = new PaletteMenu(new App(), context as any, createMockPalette(), onChange);
    const cutItem = getMenuItems(menu).find((item) => item.title === 'Cut');

    await cutItem?.clickHandler?.();

    expect(createPaletteBlock).toHaveBeenCalled();
    expect(copyToClipboard).toHaveBeenCalledWith('palette-block', defaultSettings.copyFormat);
    expect(onChange).toHaveBeenCalledWith(undefined, undefined);
  });

  it('copies palette without removing it', async () => {
    const menu = new PaletteMenu(new App(), context as any, createMockPalette(), onChange);
    const copyItem = getMenuItems(menu).find((item) => item.title === 'Copy');

    await copyItem?.clickHandler?.();

    expect(copyToClipboard).toHaveBeenCalledWith('palette-block', defaultSettings.copyFormat);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('toggles quick edit mode and reloads palette', async () => {
    const palette = createMockPalette();
    const menu = new PaletteMenu(new App(), context as any, palette, onChange);
    const quickEditItem = getMenuItems(menu).find((item) => item.title === 'Quick Edit');

    await quickEditItem?.clickHandler?.();

    expect(palette.setEditMode).toHaveBeenCalledWith(true);
    expect(palette.reload).toHaveBeenCalled();
  });
});
