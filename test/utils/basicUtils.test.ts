import { jest } from '@jest/globals';
import colorsea from 'colorsea';
import { PaletteSettings } from 'src/components/Palette';
import { CopyFormat, defaultSettings, Direction } from 'src/settings';
import {
  areSettingsDefault,
  convertStringSettings,
  copyToClipboard,
  createPaletteBlock,
  getForegroundColor,
  getModifiedSettings,
  getModifiedSettingsAsString,
  parseUrl,
  pluginToPaletteSettings,
  toNString,
} from 'src/utils/basicUtils';

jest.mock('obsidian', () => {
  const actual = jest.requireActual('obsidian') as typeof import('obsidian');
  return {
    ...actual,
    Notice: jest.fn(),
  };
});

import { Notice } from 'obsidian';

function createPaletteSettings(overrides: Partial<PaletteSettings> = {}): PaletteSettings {
  return {
    height: defaultSettings.height,
    width: defaultSettings.width,
    direction: defaultSettings.direction,
    gradient: defaultSettings.gradient,
    hover: defaultSettings.hover,
    hideText: defaultSettings.hideText,
    override: defaultSettings.override,
    aliases: [],
    ...overrides,
  };
}

describe('basicUtils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getModifiedSettings', () => {
    it('returns undefined when all palette settings match defaults', () => {
      const settings = createPaletteSettings();

      expect(getModifiedSettings(settings)).toBeUndefined();
    });

    it('retains only non-default keys', () => {
      const settings = createPaletteSettings({ height: 200 });

      expect(getModifiedSettings(settings)).toEqual({ height: 200 });
    });

    it('includes keys not defined in defaultSettings such as aliases', () => {
      const settings = createPaletteSettings({ aliases: ['primary'] });

      expect(getModifiedSettings(settings)).toEqual({ aliases: ['primary'] });
    });

    it('stops processing when aliases is an empty array', () => {
      const settings = createPaletteSettings({ height: 200, aliases: [] });

      expect(getModifiedSettings(settings)).toEqual({ height: 200 });
    });
  });

  describe('areSettingsDefault', () => {
    it('returns true when all settings match defaults', () => {
      expect(areSettingsDefault({ ...defaultSettings })).toBe(true);
    });

    it('returns false when a setting differs from default', () => {
      expect(areSettingsDefault({ ...defaultSettings, height: 999 })).toBe(false);
    });

    it('returns true when a key is absent from defaultSettings', () => {
      expect(areSettingsDefault({ customKey: 'value' } as any)).toBe(true);
    });
  });

  describe('getModifiedSettingsAsString', () => {
    it('returns JSON string for modified settings', () => {
      const settings = createPaletteSettings({ height: 200 });

      expect(getModifiedSettingsAsString(settings)).toBe(JSON.stringify({ height: 200 }));
    });

    it('returns undefined when settings are all default', () => {
      expect(getModifiedSettingsAsString(createPaletteSettings())).toBeUndefined();
    });
  });

  describe('convertStringSettings', () => {
    it('parses palette settings into an object', () => {
      const settings = createPaletteSettings({
        height: 100,
        direction: Direction.Row,
        gradient: true,
        hover: false,
        hideText: true,
        override: true,
        aliases: ['a', 'b'],
      });

      expect(convertStringSettings(settings)).toEqual({
        height: 100,
        direction: 'row',
        gradient: true,
        hover: false,
        hideText: true,
        override: true,
        aliases: ['a', 'b'],
      });
    });
  });

  describe('parseUrl', () => {
    const urlTestCases = [
      {
        url: 'https://colorhunt.co/palette/ff5733-33ff57-c70039',
        expected: ['#ff5733', '#33ff57', '#c70039'],
      },
      {
        url: 'https://coolors.co/ff573333ff57c70039',
        expected: ['#ff5733', '#33ff57', '#c70039'],
      },
      {
        url: 'https://example.com/',
        expected: [],
      },
    ];

    test.each(urlTestCases)('parses $url', ({ url, expected }) => {
      expect(parseUrl(url)).toEqual(expected);
    });
  });

  describe('pluginToPaletteSettings', () => {
    it('maps plugin settings and always sets aliases to an empty array', () => {
      expect(pluginToPaletteSettings(defaultSettings)).toEqual({
        height: defaultSettings.height,
        width: defaultSettings.width,
        direction: defaultSettings.direction,
        gradient: defaultSettings.gradient,
        hover: defaultSettings.hover,
        hideText: defaultSettings.hideText,
        override: defaultSettings.override,
        aliases: [],
      });
    });
  });

  describe('createPaletteBlock', () => {
    it('wraps a string input in a palette code block', () => {
      expect(createPaletteBlock('#ff0000\n#00ff00')).toBe('```palette\n#ff0000\n#00ff00\n```\n');
    });

    it('creates a colors-only block when settings are omitted', () => {
      expect(createPaletteBlock({ colors: ['#ff0000', '#00ff00'] })).toBe(
        '```palette\n#ff0000\n#00ff00\n```\n'
      );
    });

    it('includes settings JSON when provided', () => {
      const block = createPaletteBlock({
        colors: ['#ff0000'],
        settings: { height: 200 },
      });

      expect(block).toContain('```palette\n#ff0000\n{"height":200}\n```\n');
    });
  });

  describe('getForegroundColor', () => {
    it('returns black for light backgrounds', () => {
      expect(getForegroundColor(colorsea('#ffffff'))).toBe('#000000');
    });

    it('returns white for dark backgrounds', () => {
      expect(getForegroundColor(colorsea('#000000'))).toBe('#ffffff');
    });
  });

  describe('toNString', () => {
    it('joins colors with newlines and trims trailing newline', () => {
      expect(toNString(['#ff0000', '#00ff00', '#0000ff'])).toBe('#ff0000\n#00ff00\n#0000ff');
    });

    it('returns a single color without trailing newline', () => {
      expect(toNString(['#ff0000'])).toBe('#ff0000');
    });
  });

  describe('copyToClipboard', () => {
    it('copies raw text and shows a notice', async () => {
      await copyToClipboard('#ff0000');

      expect(Notice).toHaveBeenCalledWith('Copied #ff0000');
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('#ff0000');
    });

    it('strips hash prefix when CopyFormat is Value', async () => {
      await copyToClipboard('#ff0000', CopyFormat.Value);

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('ff0000');
    });

    it('strips rgb parentheses when CopyFormat is Value', async () => {
      await copyToClipboard('rgb(255, 0, 0)', CopyFormat.Value);

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('255, 0, 0');
    });

    it('does not transform codeblock text when CopyFormat is Value', async () => {
      await copyToClipboard('```palette\n#ff0000\n```', CopyFormat.Value);

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('```palette\n#ff0000\n```');
    });
  });
});
