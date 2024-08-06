import { EditorModal } from "./EditorModal";
import { ReorderModal } from "./ReorderModal";
import colorsea from "colorsea";
import { App, MarkdownPostProcessorContext, Menu, Notice } from "obsidian";
import { Palette, PaletteSettings } from "./Palette";
import { Direction } from "settings";
import { copyToClipboard, createPaletteBlock, getModifiedSettings } from "utils/basicUtils";

export class PaletteMenu extends Menu {
    app: App;
    context: MarkdownPostProcessorContext;
    palette: Palette;
    private onChange: (colors: string[] | undefined, settings: Partial<PaletteSettings> | undefined) => void;

    constructor(app: App, context: MarkdownPostProcessorContext, palette: Palette, onChange: (colors: string[] | undefined, settings: Partial<PaletteSettings> | undefined) => void) {
        super();
        this.app = app;
        this.context = context;
        this.palette = palette;
        this.onChange = onChange;

        this.createMenu();
    }

    private createMenu() {
        this.addItem((item) => {
            item
                .setTitle("Reorder")
                .setIcon("arrow-left-right")
                .onClick(() => {
                    const modal = new ReorderModal(this.app, this.palette, (colors, settings) => this.onChange(colors, settings));
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
                    new EditorModal(this.app, this.palette.pluginSettings, (colors, settings) => {
                        try {
                            const paletteSection = this.context.getSectionInfo(this.palette.containerEl);
                            if(paletteSection) {
                                this.onChange(colors, settings);
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
                    .setChecked(this.palette.getEditMode())
                    .onClick(async () => {
                        // Toggle palette edit mode
                        this.palette.setEditMode(!this.palette.getEditMode());
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
                    this.onChange(colors, getModifiedSettings(this.palette.settings));
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
                    this.onChange(colors, getModifiedSettings(this.palette.settings));
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
                    this.onChange(colors, getModifiedSettings(this.palette.settings));
                })
        });

        this.addSeparator();

        const input = createPaletteBlock({ colors: this.palette.colors, settings: getModifiedSettings(this.palette.settings) });

        this.addItem((item) => {
            item
                .setTitle("Cut")
                .setIcon("scissors")
                .onClick(async () => {
                    // Copy palette to clipboard
                    await copyToClipboard(input, this.palette.pluginSettings.copyFormat);
                    // Remove palette
                    this.onChange(undefined, undefined);
                })
        });
      
        this.addItem((item) => {
            item
                .setTitle("Copy")
                .setIcon("copy")
                .onClick(async () => {
                    // Copy palette to clipboard
                    await copyToClipboard(input, this.palette.pluginSettings.copyFormat);
                })
        });
    }
}