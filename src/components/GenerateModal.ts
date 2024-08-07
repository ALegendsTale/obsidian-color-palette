import { App, Editor, Notice, SuggestModal } from "obsidian";
import { PaletteSettings } from "./Palette";
import { ColorPaletteSettings } from "settings";
import { Combination, generateColors } from "utils/generateUtils";
import validateColor from "validate-color";
import colorsea from "colorsea";
import EditorUtils from "utils/editorUtils";
import { createPaletteBlock, getModifiedSettings, pluginToPaletteSettings } from "utils/basicUtils";

export class GenerateModal extends SuggestModal<Combination> {
    editor: Editor;
    settings: PaletteSettings

    constructor(app: App, editor: Editor, pluginSettings: ColorPaletteSettings) {
        super(app);
        this.editor = editor;
        this.settings = pluginToPaletteSettings(pluginSettings);
    }

    // Returns all available suggestions.
    getSuggestions(query: string): Combination[] {
        return Object.keys(Combination).filter((combination) =>
            combination.toLowerCase().includes(query.toLowerCase())
        ) as Combination[];
    }
  
    // Renders each suggestion item.
    renderSuggestion(combination: Combination, el: HTMLElement) {
        el.createEl("span", { text: combination });
    }
  
    // Perform action on the selected suggestion.
    onChooseSuggestion(combination: Combination, evt: MouseEvent | KeyboardEvent) {
        try {
            const selTextOrLine = this.editor.somethingSelected() ? this.editor.getSelection() : this.editor.getLine(this.editor.getCursor().line);
            const isLineEmpty = this.editor.getLine(this.editor.getCursor().line).length === 0;
            const isColor = validateColor(selTextOrLine);
            const { colors, settings } = isColor ? generateColors(combination, { baseColor: colorsea(selTextOrLine), settings: this.settings }) : generateColors(combination, { settings: this.settings });
            const newBlock = createPaletteBlock({ colors, settings: settings ? getModifiedSettings(settings) : undefined });
            const editorUtils = new EditorUtils(this.editor);
            editorUtils.insertContent(newBlock, !isColor && !isLineEmpty);
        }
        catch (error) {
            new Notice(error);
        }
    }
}