import { App, Editor, Notice, SuggestModal } from "obsidian";
import { PaletteSettings } from "./palette";
import { ColorPaletteSettings } from "./settings";
import { Combination, generateColors, generateRandomColors } from "./utils/generateRandom";
import validateColor from "validate-color";
import colorsea from "colorsea";
import EditorUtils from "./utils/editorUtils";
import { getModifiedSettingsAsString } from "./utils/basicUtils";

export class GeneratePaletteModal extends SuggestModal<Combination> {
    editor: Editor;
    settings: PaletteSettings

    constructor(app: App, editor: Editor, pluginSettings: ColorPaletteSettings) {
        super(app);
        this.editor = editor;
        this.settings = { height: pluginSettings.height, width: pluginSettings.width, direction: pluginSettings.direction, gradient: pluginSettings.gradient, hover: pluginSettings.hover, override: pluginSettings.override, aliases: [] };
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
            const { colors, settings } = isColor ? generateColors(colorsea(selTextOrLine), combination, this.settings) : generateRandomColors(combination, this.settings);
            const moddedSettings = settings ? getModifiedSettingsAsString(settings) : undefined;
            const newBlock = `\`\`\`palette\n${colors.toNString()}${moddedSettings ? `\n${moddedSettings}` : ''.trim()}\n\`\`\`\n`;
            const editorUtils = new EditorUtils(this.editor);
            editorUtils.insertContent(newBlock, !isColor && !isLineEmpty);
        }
        catch (error) {
            new Notice(error);
        }
    }
  }