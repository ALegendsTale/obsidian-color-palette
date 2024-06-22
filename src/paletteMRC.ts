import { MarkdownRenderChild } from "obsidian";
import ColorPalette from "./main";
import { ColorPaletteSettings } from "./settings";
import { Palette, Status } from "./palette";

export class PaletteMRC extends MarkdownRenderChild {
    plugin: ColorPalette;
    pluginSettings: ColorPaletteSettings;
	input: string;
    palette: Palette

	constructor(plugin: ColorPalette, pluginSettings: ColorPaletteSettings, containerEl: HTMLElement, input: string) {
        super(containerEl);
        this.plugin = plugin;
        this.pluginSettings = pluginSettings;
        this.input = input;
        this.palette = new Palette(this.pluginSettings, this.containerEl, this.input);
	}

    onload(): void {
        // Add new palette to state
        if(this.palette.status === Status.VALID) this.plugin.palettes?.push(this);
    }

    unload(): void {
        // Remove palette from state
        if(this.palette.status === Status.VALID) this.plugin.palettes?.remove(this);
    }
}