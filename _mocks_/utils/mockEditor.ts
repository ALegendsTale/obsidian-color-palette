import {
  Editor,
  EditorCommandName,
  EditorPosition,
  EditorRange,
  EditorSelection,
  EditorSelectionOrCaret,
  EditorTransaction,
} from 'obsidian';

type Cursor = EditorPosition;

export class MockEditor extends Editor {
  lines: string[];
  cursor: Cursor;
  selected = false;
  selection = '';
  lastCursor: Cursor | null = null;

  constructor(initialLines: string[] = ['']) {
    super();
    this.lines = [...initialLines];
    this.cursor = { line: 0, ch: 0 };
  }

  getDoc() {
    return this;
  }

  refresh() {}

  getValue() {
    return this.lines.join('\n');
  }

  setValue(content: string) {
    this.lines = content.split('\n');
  }

  getSelection() {
    return this.selection;
  }

  getLine(line: number) {
    return this.lines[line] ?? '';
  }

  getCursor(_side?: 'from' | 'to' | 'head' | 'anchor') {
    return { ...this.cursor };
  }

  setCursor(cursor: Cursor | number, ch?: number) {
    const position = typeof cursor === 'number' ? { line: cursor, ch: ch ?? 0 } : cursor;
    this.lastCursor = { ...position };
    this.cursor = { ...position };
  }

  getRange(_from: Cursor, _to: Cursor) {
    return this.selection;
  }

  replaceRange(replacement: string, from: Cursor, to?: Cursor, _origin?: string) {
    if (to === undefined) {
      const line = from.line;
      while (this.lines.length <= line) {
        this.lines.push('');
      }
      const before = this.lines[line].slice(0, from.ch);
      const after = this.lines[line].slice(from.ch);
      this.lines[line] = before + replacement + after;
      return;
    }

    const startLine = from.line;
    const endLine = to.line;

    if (startLine === endLine) {
      const line = this.lines[startLine];
      this.lines[startLine] = line.slice(0, from.ch) + replacement + line.slice(to.ch);
      return;
    }

    const first = this.lines[startLine].slice(0, from.ch) + replacement;
    const last = this.lines[endLine].slice(to.ch);
    this.lines.splice(startLine, endLine - startLine + 1, first + last);
  }

  replaceSelection(replacement: string, _origin?: string) {
    this.selection = replacement;
    if (this.selected) {
      this.lines[this.cursor.line] = replacement;
    }
  }

  somethingSelected() {
    return this.selected;
  }

  lineCount() {
    return this.lines.length;
  }

  lastLine() {
    return this.lines.length - 1;
  }

  listSelections(): EditorSelection[] {
    return [];
  }

  setSelection(_anchor: EditorPosition, _head?: EditorPosition) {}

  setSelections(_ranges: EditorSelectionOrCaret[], _main?: number) {}

  focus() {}

  blur() {}

  hasFocus() {
    return true;
  }

  getScrollInfo() {
    return { top: 0, left: 0 };
  }

  scrollTo(_x?: number | null, _y?: number | null) {}

  scrollIntoView(_range: EditorRange, _center?: boolean) {}

  undo() {}

  redo() {}

  exec(_command: EditorCommandName) {}

  transaction(_tx: EditorTransaction, _origin?: string) {}

  wordAt(_pos: EditorPosition) {
    return null;
  }

  posToOffset(_pos: EditorPosition) {
    return 0;
  }

  offsetToPos(_offset: number): EditorPosition {
    return { line: 0, ch: 0 };
  }
}

export function createMockEditor(initialLines: string[] = ['']): MockEditor {
  return new MockEditor(initialLines);
}
