import { App, Editor, Notice, SuggestModal } from "obsidian";
import { PaletteSettings } from "./palette";
import { ColorPaletteSettings } from "./settings";
import { Combination, generateRandomColors } from "./utils/generateRandom";

export class GeneratePaletteModal extends SuggestModal<Combination> {
    editor: Editor;
    settings: PaletteSettings

    constructor(app: App, editor: Editor, pluginSettings: ColorPaletteSettings) {
        super(app);
        this.editor = editor;
        this.settings = { gradient: pluginSettings.gradient, direction: pluginSettings.direction, height: pluginSettings.height, width: pluginSettings.width, aliases: [] };
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
            const { colors, settings } = generateRandomColors(combination, this.settings);
            const newBlock = `\`\`\`palette\n${colors.toString()}\n${JSON.stringify(settings)}\n\`\`\`\n`;
            this.insertEditor(this.editor, newBlock);
        }
        catch (error) {
            new Notice(error);
        }
    }
    
    insertEditor(editor: Editor, data: string): void {
        editor.somethingSelected()
        ?
        editor.replaceSelection(data)
        :
        editor.setLine(
            editor.getCursor().line,
            data
        );
        editor.setCursor({ ch: 0, line: editor.getCursor().line + 4 });
    }
  }