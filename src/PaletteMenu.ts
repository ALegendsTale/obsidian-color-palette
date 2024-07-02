import { CreatePaletteModal } from "CreatePaletteModal";
import { ReorderModal } from "ReorderModal";
import colorsea from "colorsea";
import { App, Editor, MarkdownPostProcessorContext, MarkdownView, Menu, Notice } from "obsidian";
import { Palette } from "palette";
import { Direction } from "settings";
import { createPaletteBlock, getModifiedSettings } from "utils/basicUtils";

export class PaletteMenu extends Menu {
    app: App;
    context: MarkdownPostProcessorContext;
    palette: Palette;
    editor: Editor | undefined;

    constructor(app: App, context: MarkdownPostProcessorContext, palette: Palette) {
        super();
        this.app = app;
        this.context = context;
        this.palette = palette;
        // Get the view containing the editor object
        this.editor = this.app.workspace.getActiveViewOfType(MarkdownView)?.editor;
        this.createMenu();
    }

    private getInput() {
        const paletteSection = this.getLines();
        if(paletteSection) return this.editor?.getRange({line: paletteSection.lineStart, ch: 0}, {line: paletteSection.lineEnd + 1, ch: 0});
    }

    /**
     * @returns Palette line start & line end
     */
    private getLines() {
        return this.context.getSectionInfo(this.palette.containerEl);
    }

    private replacePalette(replacement: string) {
        const paletteSection = this.getLines();
        if(paletteSection) this.editor?.replaceRange(replacement, {line: paletteSection.lineStart, ch: 0}, {line: paletteSection.lineEnd + 1, ch: 0});
    }

    private createMenu() {
        const input = this.getInput();

        this.addItem((item) => {
            item
                .setTitle("Reorder")
                .setIcon("arrow-left-right")
                .onClick(() => {
                    const modal = new ReorderModal(this.app, this.editor, this.palette, this.context, (result) => {
                        this.replacePalette(result);
                    });
                    modal.open();
                    modal.setInstructions([
                        { command: '↑↓', purpose: 'to navigate' },
                        { command: '↵', purpose: 'to use'},
                        { command: 'esc', purpose: 'to dismiss'},
                    ]);
                    modal.setPlaceholder('Choose a space to reorder palette');
                })
        })

        this.addItem((item) => {
            item
                .setTitle("Edit Mode")
                .setIcon('palette')
                .onClick(async () => {
                    new CreatePaletteModal(this.app, this.palette.pluginSettings, (result) => {
                        try {
                            const paletteSection = this.getLines();
                            if(this.editor && paletteSection) {
                                this.editor.replaceRange(result, {line: paletteSection.lineStart, ch: 0}, {line: paletteSection.lineEnd + 1, ch: 0});
                                new Notice(`Updated ${result}`);
                            }
                        } 
                        catch (error) {
                            new Notice(error);
                        }
                    }, this.palette)
                    .open();
                })
        });

        // Only show toggle edit mode option when palette is not a gradient or columns
        if(!this.palette.settings.gradient && this.palette.settings.direction !== Direction.Row) {
            this.addItem((item) => {
                item
                    .setTitle("Quick Edit")
                    .setIcon('brush')
                    .setChecked(this.palette.editMode)
                    .onClick(async () => {
                        // Toggle palette edit mode
                        this.palette.editMode = !this.palette.editMode;
                        this.palette.reload();
                    })
            });
        }

        this.addSeparator();

        this.addItem((item) => {
            item
                .setTitle("Convert to RGB")
                .setIcon("droplets")
                .onClick(() => {
                    const colors = this.palette.colors.map((color) => {
                        const rgbColor = colorsea(color).rgb();
                        return `rgb(${rgbColor[0]}, ${rgbColor[1]}, ${rgbColor[2]})`
                    })
                    this.replacePalette(createPaletteBlock({colors: colors, settings: getModifiedSettings(this.palette.settings)}));
                })
        });

        this.addItem((item) => {
            item
                .setTitle("Convert to HSL")
                .setIcon("droplets")
                .onClick(() => {
                    const colors = this.palette.colors.map((color) => {
                        const hslColor = colorsea(color).hsl();
                        return `hsl(${hslColor[0]} ${hslColor[1]}% ${hslColor[2]}%)`
                    })
                    this.replacePalette(createPaletteBlock({colors: colors, settings: getModifiedSettings(this.palette.settings)}));
                })
        });

        this.addItem((item) => {
            item
                .setTitle("Convert to HEX")
                .setIcon("droplets")
                .onClick(() => {
                    const colors = this.palette.colors.map((color) => {
                        return colorsea(color).hex(2);
                    })
                    this.replacePalette(createPaletteBlock({colors: colors, settings: getModifiedSettings(this.palette.settings)}));
                })
        });

        this.addSeparator();

        this.addItem((item) => {
            item
                .setTitle("Cut")
                .setIcon("scissors")
                .onClick(async () => {
                    // Copy palette to clipboard
                    if(input) await navigator.clipboard.writeText(input);
                    this.replacePalette('');
                })
        });
      
        this.addItem((item) => {
            item
                .setTitle("Copy")
                .setIcon("copy")
                .onClick(async () => {
                    // Copy palette to clipboard
                    if(input) await navigator.clipboard.writeText(input);
                })
        });
    }
}