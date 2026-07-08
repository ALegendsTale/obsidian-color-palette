import { jest } from '@jest/globals';
import { App, Editor } from 'obsidian';
import { Editor as MockEditor } from '_mocks_/index';
import { GenerateModal } from 'src/components/GenerateModal';
import { defaultSettings } from 'src/settings';
import { Combination } from 'src/utils/generateUtils';
import EditorUtils from 'src/utils/editorUtils';
import { createPaletteBlock } from 'src/utils/basicUtils';

jest.mock('src/utils/editorUtils', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    insertContent: jest.fn(),
  })),
}));

jest.mock('src/utils/generateUtils', () => {
  const actual = jest.requireActual('src/utils/generateUtils') as typeof import('src/utils/generateUtils');
  return {
    ...actual,
    generateColors: jest.fn(() => ({
      colors: ['#111111', '#222222'],
      settings: undefined,
    })),
  };
});

jest.mock('src/utils/basicUtils', () => {
  const actual = jest.requireActual('src/utils/basicUtils') as typeof import('src/utils/basicUtils');
  return {
    ...actual,
    createPaletteBlock: jest.fn(() => 'palette-block'),
  };
});

jest.mock('validate-color', () => ({
  __esModule: true,
  default: jest.fn((value: string) => value.startsWith('#')),
}));

describe('GenerateModal', () => {
  let editor: Editor;
  let modal: GenerateModal;
  let insertContent: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    insertContent = jest.fn();
    (EditorUtils as jest.Mock).mockImplementation(() => ({ insertContent }));
    editor = new MockEditor() as unknown as Editor;
    modal = new GenerateModal(new App(), editor, defaultSettings);
  });

  describe('getSuggestions', () => {
    it('returns all combinations when query is empty', () => {
      expect(modal.getSuggestions('')).toHaveLength(Object.keys(Combination).length);
    });

    it('filters combinations by query', () => {
      expect(modal.getSuggestions('tri')).toEqual(['Triadic']);
    });
  });

  describe('onChooseSuggestion', () => {
    it('inserts generated palette using selected color as base', () => {
      jest.spyOn(editor, 'somethingSelected').mockReturnValue(true);
      jest.spyOn(editor, 'getSelection').mockReturnValue('#ff0000');

      modal.onChooseSuggestion(Combination.Complimentary, new KeyboardEvent('keydown', { key: 'Enter' }));

      expect(createPaletteBlock).toHaveBeenCalled();
      expect(insertContent).toHaveBeenCalledWith('palette-block', false);
    });

    it('inserts on empty line without replacing line content', () => {
      jest.spyOn(editor, 'somethingSelected').mockReturnValue(false);
      jest.spyOn(editor, 'getLine').mockReturnValue('');
      jest.spyOn(editor, 'getCursor').mockReturnValue({ line: 0, ch: 0 });

      modal.onChooseSuggestion(Combination.Random, new KeyboardEvent('keydown', { key: 'Enter' }));

      expect(insertContent).toHaveBeenCalledWith('palette-block', false);
    });

    it('replaces line content when line is not empty and text is not a color', () => {
      jest.spyOn(editor, 'somethingSelected').mockReturnValue(false);
      jest.spyOn(editor, 'getLine').mockReturnValue('some text');
      jest.spyOn(editor, 'getCursor').mockReturnValue({ line: 2, ch: 0 });

      modal.onChooseSuggestion(Combination.Analogous, new KeyboardEvent('keydown', { key: 'Enter' }));

      expect(insertContent).toHaveBeenCalledWith('palette-block', true);
    });
  });
});
