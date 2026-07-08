import { jest } from '@jest/globals';
import { App } from 'obsidian';
import { EditorModal } from 'src/components/EditorModal';
import { Palette, PaletteSettings } from 'src/components/Palette';
import { defaultSettings, Direction } from 'src/settings';
import { generateColors } from 'src/utils/generateUtils';

jest.mock('src/components/Palette', () => {
  const actual = jest.requireActual('src/components/Palette') as typeof import('src/components/Palette');
  return {
    ...actual,
    Palette: jest.fn().mockImplementation((_colors, _settings, containerEl: HTMLElement) => ({
      colors: ['#ff0000'],
      settings: _settings,
      containerEl,
      emitter: {
        on: jest.fn(),
        emit: jest.fn(),
        clear: jest.fn(),
      },
      reload: jest.fn(),
    })),
  };
});

jest.mock('src/utils/generateUtils', () => {
  const actual = jest.requireActual('src/utils/generateUtils') as typeof import('src/utils/generateUtils');
  return {
    ...actual,
    generateColors: jest.fn(() => ({
      colors: ['#aaaaaa', '#bbbbbb'],
      settings: undefined,
    })),
  };
});

jest.mock('src/utils/canvasUtils', () => ({
  Canvas: jest.fn(),
}));

jest.mock('src/utils/imageUtils', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    canvas: document.createElement('canvas'),
    image: document.createElement('img'),
    update: jest.fn(),
    getPalette: jest.fn(),
    getCanvasHex: jest.fn(),
  })),
}));

function getCreateButton(modal: EditorModal) {
  return Array.from(modal.contentEl.querySelectorAll('button'))
    .find((button) => button.textContent === 'Create');
}

describe('EditorModal', () => {
  let onSubmit: jest.Mock;
  let modal: EditorModal;

  beforeEach(() => {
    jest.clearAllMocks();
    global.ResizeObserver = jest.fn().mockImplementation(() => ({
      observe: jest.fn(),
      unobserve: jest.fn(),
      disconnect: jest.fn(),
    })) as any;
    onSubmit = jest.fn();
    modal = new EditorModal(new App(), defaultSettings, onSubmit);
  });

  it('opens with editor header and palette preview section', () => {
    modal.open();

    expect(modal.contentEl.querySelector('h1')?.textContent).toBe('Editor');
    expect(modal.contentEl.classList.contains('palette-editor')).toBe(true);
    expect(modal.contentEl.querySelector('.palette-preview')).toBeTruthy();
  });

  it('calls onSubmit with generated colors when Create is clicked with no colors', () => {
    modal.open();
    modal.colors = [];

    const createButton = getCreateButton(modal);
    createButton?.click();

    expect(generateColors).toHaveBeenCalled();
    expect(onSubmit).toHaveBeenCalledWith(['#aaaaaa', '#bbbbbb'], undefined);
  });

  it('calls onSubmit with existing colors when Create is clicked', () => {
    const paletteSettings: PaletteSettings = {
      height: 120,
      width: 300,
      direction: Direction.Column,
      gradient: false,
      hover: false,
      hideText: false,
      override: false,
      aliases: [],
    };
    const palette = {
      colors: ['#123456', '#abcdef'],
      settings: paletteSettings,
    } as Palette;

    modal = new EditorModal(new App(), defaultSettings, onSubmit, palette);
    modal.open();

    const createButton = getCreateButton(modal);
    createButton?.click();

    expect(onSubmit).toHaveBeenCalledWith(['#123456', '#abcdef'], expect.any(Object));
  });

  it('clears content on close', () => {
    modal.open();
    modal.onClose();

    expect(modal.contentEl.innerHTML).toBe('');
  });
});
