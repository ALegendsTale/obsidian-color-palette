import { jest } from '@jest/globals';
import { AliasMode, Direction } from 'src/settings';
import { PaletteItem, PaletteItemSettings } from 'src/components/PaletteItem';

jest.mock('src/utils/basicUtils', () => ({
  getForegroundColor: jest.fn(() => '#000000'),
}));

describe('A PaletteItem', () => {
  let mockContainer: HTMLElement;
  let defaultPaletteItemSetting: PaletteItemSettings;
  let testColor: string;

  beforeEach(() => {
    jest.clearAllMocks();
    mockContainer = document.createElement('div');
    testColor = 'blue';
    defaultPaletteItemSetting = {
      aliasMode: AliasMode.Both,
      stabilityWhileEditing: true,
      height: 100,
      direction: Direction.Column,
      hover: false,
      hideText: false,
      alias: '',
      editMode: false,
      colorCount: 1,
    };
  });

  describe(' when constructed', () => {
    it('will add a new div and store it on the palette item', () => {
      const createElSpy = jest.spyOn(mockContainer, 'createEl');

      const paletteItem = new PaletteItem(mockContainer, testColor, defaultPaletteItemSetting);

      expect(createElSpy).toHaveBeenCalledWith('div');
      expect(paletteItem.container).toBeDefined();
      expect(paletteItem.container).toBeInstanceOf(HTMLDivElement);
    });

    it('stores the passed color', () => {
      const color = 'red';
      const paletteItem = new PaletteItem(mockContainer, color, defaultPaletteItemSetting);

      expect(paletteItem.color).toBe('red');
    });

    it('stores the passed settings', () => {
      const paletteItemSetting = {
        aliasMode: AliasMode.Both,
        stabilityWhileEditing: true,
        height: 100,
        direction: Direction.Column,
        hover: false,
        hideText: false,
        alias: '',
        editMode: false,
        colorCount: 1,
      };

      const paletteItem = new PaletteItem(mockContainer, testColor, paletteItemSetting);

      expect(paletteItem.settings).toEqual(defaultPaletteItemSetting);
    });

    it('creates an emitter', () => {
      const paletteItem = new PaletteItem(mockContainer, testColor, defaultPaletteItemSetting);

      expect(paletteItem.emitter).toBeDefined();
    });
  });

  describe('handles color by', () => {
    const colorTestCases = [
      { input: ' blue ', expected: 'blue' },
      { input: ' light blue ', expected: 'light blue' },
      { input: '#FFF', expected: '#FFF' },
      { input: '  rgb(255, 0, 0)  ', expected: 'rgb(255, 0, 0)' },
    ];

    test.each(colorTestCases)(
      'trimming whitespace from color input: "$input" → "$expected"',
      ({ input, expected }) => {
        const paletteItem = new PaletteItem(mockContainer, input, defaultPaletteItemSetting);

        expect(paletteItem.color).toBe(expected);
      }
    );
  });

  describe('styles containers by', () => {
    it('setting background color on container', () => {
      const color = '#FF5733';
      const paletteItem = new PaletteItem(mockContainer, color, defaultPaletteItemSetting);

      expect(paletteItem.container.style.getPropertyValue('--palette-background-color')).toBe(color);
    });

    const flexTestCases = [
      { colors: 1, height: 100, expected: 50 },
      { colors: 2, height: 100, expected: 25 },
      { colors: 3, height: 102, expected: 17 },
      { colors: 2, height: 50, expected: 12.5 },
      { colors: 5, height: 500, expected: 50 },
    ];

    test.each(flexTestCases)(
      'calculating flex basis: height=$height, colorCount=$colors → $expected px',
      ({ colors, height, expected }) => {
        const settings = { ...defaultPaletteItemSetting, height, colorCount: colors };
        const paletteItem = new PaletteItem(mockContainer, testColor, settings);

        expect(paletteItem.container.style.getPropertyValue('--palette-column-flex-basis')).toBe(`${expected}px`);
      }
    );
  });

  describe('Text display', () => {
    describe('when aliasMode is Both and no alias is set', () => {
      it('creates a span with the uppercase color', () => {
        const settings = { ...defaultPaletteItemSetting, aliasMode: AliasMode.Both, alias: '' };

        new PaletteItem(mockContainer, '#fff', settings);

        expect(jest.mocked(HTMLElement.prototype.createEl)).toHaveBeenCalledWith(
          'span',
          expect.objectContaining({ text: '#FFF' })
        );
      });
    });

    describe('when aliasMode is Both and alias is set', () => {
      it('creates two spans: one for color and one for alias', () => {
        const settings = { ...defaultPaletteItemSetting, aliasMode: AliasMode.Both, alias: 'primary' };

        new PaletteItem(mockContainer, '#fff', settings);

        expect(jest.mocked(HTMLElement.prototype.createEl)).toHaveBeenCalledWith(
          'span',
          expect.objectContaining({ text: '#FFF' })
        );
        expect(jest.mocked(HTMLElement.prototype.createEl)).toHaveBeenCalledWith(
          'span',
          expect.objectContaining({ text: 'primary' })
        );
      });
    });

    describe('when aliasMode is Alias only', () => {
      it('creates a span with the alias text', () => {
        const settings = { ...defaultPaletteItemSetting, aliasMode: AliasMode.Alias, alias: 'primary-blue' };

        new PaletteItem(mockContainer, '#fff', settings);

        expect(jest.mocked(HTMLElement.prototype.createEl)).toHaveBeenCalledWith(
          'span',
          expect.objectContaining({ text: 'primary-blue' })
        );
      });
    });

    describe('when alias is empty string or whitespace', () => {
      it('displays color instead of alias', () => {
        const settings = { ...defaultPaletteItemSetting, aliasMode: AliasMode.Both, alias: '  ' };

        new PaletteItem(mockContainer, '#fff', settings);

        expect(jest.mocked(HTMLElement.prototype.createEl)).toHaveBeenCalledWith(
          'span',
          expect.objectContaining({ text: '#FFF' })
        );
      });
    });
  });

  describe('handles Events', () => {
    it('by registering a click event listener', () => {
      const paletteItem = new PaletteItem(mockContainer, testColor, defaultPaletteItemSetting);
      const handler = jest.fn();
      paletteItem.emitter.on('click', handler);

      paletteItem.container.dispatchEvent(new MouseEvent('click', { bubbles: true }));

      expect(handler).toHaveBeenCalled();
    });

    it('unloading clears the emitter', () => {
      const paletteItem = new PaletteItem(mockContainer, 'blue', defaultPaletteItemSetting);
      const clearSpy = jest.spyOn(paletteItem.emitter, 'clear');

      paletteItem.unload();

      expect(clearSpy).toHaveBeenCalled();
    });
  });

  describe('Edit mode interaction', () => {
    it('does not create EditMode when direction is Row (incompatible)', () => {
      const settings = { ...defaultPaletteItemSetting, direction: Direction.Row, editMode: true };

      new PaletteItem(mockContainer, 'blue', settings);

      expect(jest.mocked(HTMLElement.prototype.createEl)).toHaveBeenCalledWith(
        'span',
        expect.any(Object)
      );
      expect(jest.mocked(HTMLElement.prototype.createEl)).not.toHaveBeenCalledWith(
        'div',
        expect.objectContaining({ cls: 'edit-container' })
      );
    });

    describe('when edit mode is active and direction is Column', () => {
      let editSettings: PaletteItemSettings;

      beforeEach(() => {
        editSettings = {
          ...defaultPaletteItemSetting,
          direction: Direction.Column,
          editMode: true,
          alias: 'primary',
          colorCount: 4,
        };
      });

      it('creates an edit container with trash button', () => {
        const paletteItem = new PaletteItem(mockContainer, '#ff0000', editSettings);

        const editContainer = paletteItem.container.querySelector('.edit-container');
        expect(editContainer).toBeTruthy();
        expect(editContainer?.querySelector('button')).toBeTruthy();
      });

      it('emits trash event when trash button is clicked', () => {
        const paletteItem = new PaletteItem(mockContainer, '#ff0000', editSettings);
        const trashHandler = jest.fn();
        paletteItem.emitter.on('trash', trashHandler);

        const trashButton = paletteItem.container.querySelector('button')!;
        trashButton.dispatchEvent(new MouseEvent('click', { bubbles: true }));

        expect(trashHandler).toHaveBeenCalled();
      });

      it('makes span editable on click and emits alias on Enter', () => {
        const paletteItem = new PaletteItem(mockContainer, '#ff0000', editSettings);
        const aliasHandler = jest.fn();
        paletteItem.emitter.on('alias', aliasHandler);

        const span = paletteItem.container.querySelector('.edit-container span') as HTMLSpanElement;
        span.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        span.textContent = 'updated-alias';
        span.dispatchEvent(new KeyboardEvent('keypress', { key: 'Enter', bubbles: true }));

        expect(aliasHandler).toHaveBeenCalledWith('updated-alias');
      });

      it('resets alias on contextmenu and emits empty alias', () => {
        const paletteItem = new PaletteItem(mockContainer, '#ff0000', editSettings);
        const aliasHandler = jest.fn();
        paletteItem.emitter.on('alias', aliasHandler);

        const span = paletteItem.container.querySelector('.edit-container span') as HTMLSpanElement;
        span.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true }));

        expect(span.textContent).toBe('#FF0000');
        expect(aliasHandler).toHaveBeenCalledWith('');
      });

      it('restores stored alias when blur leaves span empty', () => {
        const paletteItem = new PaletteItem(mockContainer, '#ff0000', { ...editSettings, alias: 'primary' });

        const span = paletteItem.container.querySelector('.edit-container span') as HTMLSpanElement;
        span.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        span.textContent = '   ';
        span.dispatchEvent(new FocusEvent('focusout', { bubbles: true }));

        expect(span.textContent).toBe('primary');
      });

      it('sets smaller font size when colorCount increases', () => {
        const fewColors = new PaletteItem(mockContainer, '#ff0000', { ...editSettings, colorCount: 2 });
        const manyColors = new PaletteItem(mockContainer, '#ff0000', { ...editSettings, colorCount: 10 });

        const fewSpan = fewColors.container.querySelector('.edit-container span') as HTMLSpanElement;
        const manySpan = manyColors.container.querySelector('.edit-container span') as HTMLSpanElement;

        const fewSize = parseFloat(fewSpan.style.getPropertyValue('--edit-font-size'));
        const manySize = parseFloat(manySpan.style.getPropertyValue('--edit-font-size'));

        expect(manySize).toBeLessThan(fewSize);
        expect(manySize).toBeGreaterThanOrEqual(10);
      });
    });
  });
});
