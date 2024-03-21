import { Editor } from "obsidian"

type Options = {
    line?: number,
    offset?: number
}

export default class EditorUtils {
    editor: Editor

    constructor(editor: Editor) {
        this.editor = editor;
    }

    /**
     * Replaces selection or text at the cursor
     * @param content The content to be inserted
     * @param insertAfter Inserts the content after the current line
     */
    public insertContent(content: string, insertAfter = false): void {
        this.setCursorPostCallback((line) => {
            this.editor.somethingSelected() ?
            this.editor.replaceSelection(content)
            :
            insertAfter ?
            this.insertLine(content, 'after')
            :
            this.replaceLine(content, line);
        });
    }

    /**
     * Sets the cursor to a position after callback editor changes
     * @param callback Changes to perform to the editor
     * @param options.line Defaults to the current cursor line
     * @param options.offset The number of lines to offset (calculates during function unless user specified)
     */
    public setCursorPostCallback(callback: ( line: number ) => void, { line = this.editor.getCursor().line, offset }: Options = {}) {
        // Number of lines before adding content
        const preLinesCount = this.editor.lineCount();

        callback(line);

        // Number of lines after adding content
        const postLinesCount = this.editor.lineCount() - preLinesCount;
        
        // Set offset to postLinesCount if not specified
        offset = offset || postLinesCount;

        this.editor.setCursor({ ch: 0, line: line + offset });
    }

    /**
     * 
     * @param options.line The line to retrieve the last character index from
     * @param options.offset The offset used from the line (for example, 1 could be used to get the last character index on the line below the cursor)
     * @returns The last character's index on the line
     */
    public getLastCh({ line = this.editor.getCursor().line, offset = 0 }: Options = {}): number {
        return this.editor.getLine(line + offset).length;
    }

    /**
     * Replaces a single line
     * @param content The content to replace the line with
     * @param line The line to replace
     */
    public replaceLine(content: string, line: number) {
        const lineContent = this.editor.getLine(line);
        this.editor.replaceRange(content, { line: line, ch: 0 }, { line: line, ch: lineContent.length});
    }

    /**
     * Inserts content into editor before or after the line
     * @param content The content to insert
     * @param location Where to insert the content, before or after the line
     * @param options.line Defaults to cursor line
     * @param options.ch Defaults to 0
     */
    public insertLine(content: string, location: 'before' | 'after' = 'before', { line = this.editor.getCursor().line, ch = 0 } = {}) {
        if(location === 'before') {
            this.editor.replaceRange(content, { line, ch });
        }
        if(location === 'after') {
            // If last line, add a newline before adding content
            this.editor.replaceRange(
                this.editor.lastLine() === line ? '\n' + content : content + '\n', 
                { line: line + 1, ch }
            )
        }
    }
}