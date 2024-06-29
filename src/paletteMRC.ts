import { MarkdownPostProcessorContext, MarkdownRenderChild } from "obsidian";
import ColorPalette, { urlRegex } from "main";
import { ColorPaletteSettings } from "settings";
import { Palette, PaletteSettings, Status } from "palette";
import { parseUrl, pluginToPaletteSettings } from "utils/basicUtils";
import validateColor from "validate-color";
import { PaletteMenu } from "PaletteMenu";

export class PaletteMRC extends MarkdownRenderChild {
    plugin: ColorPalette;
    pluginSettings: ColorPaletteSettings;
	input: string;
    palette: Palette
    context: MarkdownPostProcessorContext;

	constructor(plugin: ColorPalette, containerEl: HTMLElement, input: string, ctx: MarkdownPostProcessorContext) {
        super(containerEl);
        this.plugin = plugin;
        this.pluginSettings = plugin.settings;
        this.input = input;
        this.context = ctx;
	}

    onload(): void {
        this.update();
        // Add new palette to state
        this.plugin.palettes?.push(this);

        this.containerEl.addEventListener('contextmenu', (e) => {
            const paletteMenu = new PaletteMenu(this.plugin.app, this.context, this.palette);
            paletteMenu.showAtMouseEvent(e);
        })
    }

    unload(): void {
        // Remove palette from state
        this.plugin.palettes?.remove(this);
    }

    /**
     * Updates the palette contents
     */
    public update() {
        // Remove current palette
        this.containerEl.empty();

        // Calculate colors & settings
        const { colors, settings } = this.calcColorsAndSettings(this.input);

        // Create new palette
        this.palette = new Palette(colors, settings, this.containerEl, this.pluginSettings);
    }

    /**
     * Parses input & extracts settings
     * @param input settings from codeblock
     * @returns PaletteSettings or Status if settings are not valid
     */
    private parseSettings(input: string): PaletteSettings | Status {
        try {
            // Extract JSON settings from the palette
            return JSON.parse(input);
        }
        catch(error) {
            return Status.INVALID_SETTINGS;
        }
    }

    /**
     * Parses input & extracts colors based on color space or URL
     * @param input colors from codeblock
     * @returns Array of colors or Status if colors are not valid
     */
    private parseColors(input: string[], override: boolean): string[] | Status {        
        let colors = input.flatMap((color) => {
            // Split RGB / HSL delimited by semicolons
            if(color.includes('(')){
                return color.split(';').flatMap((postSplitColor) => postSplitColor.trim())
                // Remove whitespace elements from array
                .filter((color) => color !== '');
            }
            // Split colors delimited by commas
            return color.split(',').flatMap((postSplitColor) => {
                return postSplitColor.trim();
            })
        // Remove semicolons
        }).flatMap((color) => color.trim().replace(';', ''));

        // Combine colors array into string
        const rawColors = colors.join('');

        // If URL parse and return
        if(rawColors.match(urlRegex)) return parseUrl(rawColors);

        // Return status if colors are invalid
        if (!override) {
            for(let color of colors) {
                if(!validateColor(color)) return Status.INVALID_COLORS;
            }
        }

        // Return final colors array
        return colors;
    }

    /**
     * Calculates colors and settings based on codeblock contents
     */
    private calcColorsAndSettings(input: string) {
        // Splits input by newline creaitng an array
        const split = input.split('\n')
        // Returns true if palette settings are defined
        const hasSettings = split.some((val) => val.includes(('{')));

        // Remove and parse the last split index (settings are always defined on the last index)
        let settings = hasSettings ? this.parseSettings(split.pop() || '') : undefined;

        // Get PaletteSettings if valid or plugin defaults if invalid
        let settingsObj = typeof settings === 'object' ? settings : pluginToPaletteSettings(this.pluginSettings);

        return { colors: this.parseColors(split, settingsObj.override), settings: settings || pluginToPaletteSettings(this.pluginSettings) };
    }
}