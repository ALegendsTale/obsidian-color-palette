import { jest } from '@jest/globals';
import colorsea from 'colorsea';
import { App } from 'obsidian';
import { Reorder, ReorderModal } from 'src/components/ReorderModal';
import { Palette, PaletteSettings } from 'src/components/Palette';
import { Direction } from 'src/settings';
import { getModifiedSettings } from 'src/utils/basicUtils';

jest.mock('src/utils/basicUtils', () => {
  const actual = jest.requireActual('src/utils/basicUtils') as typeof import('src/utils/basicUtils');
  return {
    ...actual,
    getModifiedSettings: jest.fn((s) => s),
  };
});

describe('ReorderModal', () => {
  let mockPalette: Palette;
  let onSubmit: jest.Mock;
  let modal: ReorderModal;

  const paletteSettings: PaletteSettings = {
    height: 100,
    width: 200,
    direction: Direction.Column,
    gradient: false,
    hover: false,
    hideText: false,
    override: false,
    aliases: [],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    onSubmit = jest.fn();
    mockPalette = {
      colors: ['#0000ff', '#ff0000', '#00ff00'],
      settings: paletteSettings,
    } as Palette;
    modal = new ReorderModal(new App(), mockPalette, onSubmit);
  });

  describe('getSuggestions', () => {
    it('returns all reorder options when query is empty', () => {
      expect(modal.getSuggestions('')).toHaveLength(7);
    });

    it('filters reorder options by query', () => {
      const suggestions = modal.getSuggestions('hue');
      expect(suggestions).toEqual(['Hue']);
    });
  });

  describe('onChooseSuggestion', () => {
    const reorderModes = [
      Reorder.Hue,
      Reorder.Saturation,
      Reorder.Lightness,
      Reorder.Red,
      Reorder.Green,
      Reorder.Blue,
      Reorder.Alpha,
    ] as const;

    function expectedOrder(mode: Reorder, colors: string[]) {
      const csColors = colors.map((color) => colorsea(color));
      switch (mode) {
        case Reorder.Hue:
          return csColors.sort((a, b) => a.hue() - b.hue()).map((color) => color.hex());
        case Reorder.Saturation:
          return csColors.sort((a, b) => a.saturation() - b.saturation()).map((color) => color.hex());
        case Reorder.Lightness:
          return csColors.sort((a, b) => a.lightness() - b.lightness()).map((color) => color.hex());
        case Reorder.Red:
          return csColors.sort((a, b) => a.red() - b.red()).map((color) => color.hex());
        case Reorder.Green:
          return csColors.sort((a, b) => a.green() - b.green()).map((color) => color.hex());
        case Reorder.Blue:
          return csColors.sort((a, b) => a.blue() - b.blue()).map((color) => color.hex());
        case Reorder.Alpha:
          return csColors.sort((a, b) => a.alpha() - b.alpha()).map((color) => color.hex());
      }
    }

    test.each(reorderModes)('sorts colors by %s', (mode) => {
      modal.onChooseSuggestion(mode, new KeyboardEvent('keydown', { key: 'Enter' }));

      expect(onSubmit).toHaveBeenCalledWith(
        expectedOrder(mode, mockPalette.colors),
        paletteSettings
      );
      expect(getModifiedSettings).toHaveBeenCalledWith(paletteSettings);
    });
  });
});
