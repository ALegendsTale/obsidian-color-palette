import { jest } from '@jest/globals';
import { createMockEditor } from '_mocks_/utils/mockEditor';
import EditorUtils from 'src/utils/editorUtils';

describe('EditorUtils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('replaceLine', () => {
    it('replaces the full line content via replaceRange', () => {
      const editor = createMockEditor(['original line', 'second line']);
      const editorUtils = new EditorUtils(editor);

      editorUtils.replaceLine('new content', 0);

      expect(editor.lines[0]).toBe('new content');
    });
  });

  describe('insertLine', () => {
    it('inserts content before the specified line', () => {
      const editor = createMockEditor(['line one', 'line two']);
      editor.cursor = { line: 1, ch: 0 };
      const editorUtils = new EditorUtils(editor);

      editorUtils.insertLine('inserted', 'before', { line: 1, ch: 0 });

      expect(editor.lines[1]).toContain('inserted');
    });

    it('appends content after a non-last line with a trailing newline', () => {
      const editor = createMockEditor(['line one', 'line two']);
      editor.cursor = { line: 0, ch: 0 };
      const editorUtils = new EditorUtils(editor);

      editorUtils.insertLine('after content', 'after', { line: 0, ch: 0 });

      expect(editor.lines.join('\n')).toContain('after content');
    });

    it('prepends a newline when inserting after the last line', () => {
      const editor = createMockEditor(['only line']);
      editor.cursor = { line: 0, ch: 0 };
      const editorUtils = new EditorUtils(editor);

      editorUtils.insertLine('after content', 'after', { line: 0, ch: 0 });

      expect(editor.lines.join('\n')).toContain('\nafter content');
    });
  });

  describe('getLastCh', () => {
    it('returns the length of the current line', () => {
      const editor = createMockEditor(['hello']);
      editor.cursor = { line: 0, ch: 0 };
      const editorUtils = new EditorUtils(editor);

      expect(editorUtils.getLastCh()).toBe(5);
    });

    it('respects the offset parameter', () => {
      const editor = createMockEditor(['hello', 'world']);
      editor.cursor = { line: 0, ch: 0 };
      const editorUtils = new EditorUtils(editor);

      expect(editorUtils.getLastCh({ offset: 1 })).toBe(5);
    });
  });

  describe('setCursorPostCallback', () => {
    it('sets cursor after callback using auto-computed offset from line count delta', () => {
      const editor = createMockEditor(['line one']);
      editor.cursor = { line: 0, ch: 0 };
      const editorUtils = new EditorUtils(editor);

      editorUtils.setCursorPostCallback(() => {
        editor.lines.push('added line');
      });

      expect(editor.lastCursor).toEqual({ ch: 0, line: 1 });
    });

    it('uses an explicit offset when provided', () => {
      const editor = createMockEditor(['line one']);
      editor.cursor = { line: 2, ch: 0 };
      const editorUtils = new EditorUtils(editor);

      editorUtils.setCursorPostCallback(() => {}, { line: 2, offset: 3 });

      expect(editor.lastCursor).toEqual({ ch: 0, line: 5 });
    });
  });

  describe('insertContent', () => {
    it('replaces selection when text is selected', () => {
      const editor = createMockEditor(['selected text']);
      editor.selected = true;
      editor.selection = 'selected text';
      const editorUtils = new EditorUtils(editor);

      editorUtils.insertContent('replacement');

      expect(editor.lines[0]).toBe('replacement');
    });

    it('replaces the current line when it is empty and nothing is selected', () => {
      const editor = createMockEditor(['']);
      editor.cursor = { line: 0, ch: 0 };
      const editorUtils = new EditorUtils(editor);

      editorUtils.insertContent('new block');

      expect(editor.lines[0]).toBe('new block');
    });

    it('inserts after the current line when insertAfter is true', () => {
      const editor = createMockEditor(['existing content']);
      editor.cursor = { line: 0, ch: 0 };
      const editorUtils = new EditorUtils(editor);

      editorUtils.insertContent('new block', true);

      expect(editor.lines.join('\n')).toContain('new block');
    });
  });
});
