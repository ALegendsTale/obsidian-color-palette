import { MarkdownRenderChild, Notice } from "obsidian";
import colorsea from 'colorsea';
import ColorPalette, { urlRegex } from "./main";
import { Direction, AliasMode, ColorPaletteSettings } from "./settings";

export type PaletteSettings = {
    gradient: boolean
    height: number
    width: number
    direction: Direction
    aliases: string[]
}

enum Status {
    VALID = 'Valid',
    INVALID_COLORS = 'Invalid Colors',
    INVALID_SETTINGS = 'Invalid Settings',
    INVALID_COLORS_AND_SETTINGS = 'Invalid Colors & Settings',
    INVALID_GRADIENT = 'Invalid Gradient'
}

// Identifies whether color palette hex codes or url are valid
const fullRegex = /^((?:#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})(?:,\s*|$))+|(?:https:\/\/www\.|http:\/\/www\.|https:\/\/|http:\/\/)?[a-zA-Z0-9]{2,}(?:\.[a-zA-Z0-9]{2,})(?:\.[a-zA-Z0-9]{2,})?\/palette\/([a-zA-Z0-9-]{2,}))(?<!,|,s*)$/
// Hex code validation
const colorsRegex = /(?:#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})(?:,\s*|$))+/

export class Palette extends MarkdownRenderChild {
    plugin: ColorPalette;
    pluginSettings: ColorPaletteSettings;
	input: string;
	colors: string[];
    settings: PaletteSettings;
    status: Status

	constructor(plugin: ColorPalette, pluginSettings: ColorPaletteSettings, containerEl: HTMLElement, input: string) {
        super(containerEl);
        this.plugin = plugin;
        this.pluginSettings = pluginSettings;
        this.input = input;
        this.colors = [];
        this.status = Status.VALID;
        this.setDefaultSettings();
	}

    /**
     * Set the initial default settings
     */
    private setDefaultSettings() {
        this.settings = { gradient: this.pluginSettings.gradient, direction: this.pluginSettings.direction, height: this.pluginSettings.height, width: this.pluginSettings.width, aliases: [] };
    }

    /**
     * Calculates colors and settings based on codeblock contents
     */
    updateColorsAndSettings() {
        // Combines regex to create full palette validation regex (should end up being same as fullRegex const)
        const paletteRegex = new RegExp(`^(?:${colorsRegex.source}|${urlRegex.source})(?<!,|,\s*)$`);
        let split = this.input.split('\n')
        let rawColors = split.filter((val) => {
            // Filter only the colors
            if(!val.contains('{'))
                // Trim in case there are trailing whitespaces the user added
                return val.trim();
                // Convert array to comma delimited string
        }).toString();
        // Set local settings if specified
        if(split.some((val) => val.contains('{')) && split.length !== 1){
            try {
                // Extract JSON settings from the palette
                const parsedSplit: PaletteSettings = JSON.parse(split[split.length - 1]);
                this.settings = {...this.settings, ...parsedSplit};
            } catch (error) {
                this.status = Status.INVALID_SETTINGS;
            }
        }
        // Check for invalid Palette
        rawColors.match(paletteRegex) === null ?
        // Set status to Invalid Colors & Settings if settings were deemed invalid
        this.status === Status.INVALID_SETTINGS ? this.status = Status.INVALID_COLORS_AND_SETTINGS : this.status = Status.INVALID_COLORS
        :
        // Check if colors are derived from hex codes
        rawColors.match(colorsRegex)?.[0] ?
        this.colors = rawColors.split(',').filter((v) => v.trim())
        :
        // Check if url colors contain dashes in-between
        rawColors.match(urlRegex) && rawColors.contains('-') ?
        // Replace dashes with hexes (colorhunt)
        this.colors = rawColors.substring(rawColors.lastIndexOf('/') + 1).split('-').map(i => '#' + i)
        :
        // Add hex between URL path colors (coolors)
        this.colors = rawColors.substring(rawColors.lastIndexOf('/') + 1).match(/.{1,6}/g)?.map(i => '#' + i) || []
    }
  
	onload() {
        this.updateColorsAndSettings();

        // Add new palette to state
        if(this.status === Status.VALID) this.plugin.palettes?.push(this);

        // Create new palette
        this.createPalette(this.colors, this.settings);
	}

    unload() {
        // Remove palette from state
        if(this.status === Status.VALID) this.plugin.palettes?.remove(this);
    }

    /**
     * Refreshes the palette contents
     */
    public refresh(){
        // Reset settings to default before re-calculating colors & settings
        this.setDefaultSettings();
        // Recalculate colors & settings
        this.updateColorsAndSettings();
        // Remove palette contents
        this.containerEl.empty();
        // Create new palette
        this.createPalette(this.colors, this.settings)
    }
    
    /**
     * Create new palette contents based on colors & settings
     * @param colors 
     * @param settings 
     */
    public createPalette(colors: string[], settings: PaletteSettings){
        this.containerEl.addClass('palette')
        this.containerEl.style.setProperty('--palette-direction', settings.direction === Direction.Row ? Direction.Column : Direction.Row);
        this.containerEl.style.setProperty('--not-palette-direction', settings.direction);
        this.containerEl.style.setProperty('--palette-height', `${settings.height}px`);

        try{
            // Throw error & create Invalid Palette
            if(this.status !== Status.VALID) throw new PaletteError(this.status);
            this.settings.gradient ?
            createGradientPalette(this.containerEl, colors, settings)
            :
            createColorPalette(this.containerEl, colors, settings.height, this.pluginSettings.aliasMode);
        }
        catch(err){
            if(err instanceof PaletteError)
            this.createInvalidPalette(err.status, err.message);
            else
            new Notice(err);
        }

        function createGradientPalette(containerEl: HTMLElement, colors: string[], settings: PaletteSettings){
            if(colors.length <= 1) throw new PaletteError(Status.INVALID_GRADIENT);
            let child = containerEl.createEl('canvas');
            child.width = settings.width;
            child.height = settings.height;

            const tooltip = containerEl.createEl('section');
            tooltip.addClasses(['tooltip', 'palette-tooltip']);
            const tooltipText = tooltip.createEl('span');

            let context = child.getContext('2d', {willReadFrequently: true});
            if(context != null){
                let gradient = settings.direction === Direction.Column ? context.createLinearGradient(0, 0, settings.width, 0) : context.createLinearGradient(0, 0, 0, settings.height);

                for(const[i, color] of colors.entries()){
                    gradient.addColorStop(i / (colors.length - 1), color);
                }

                context.fillStyle = gradient || '#000';
                context.fillRect(0, 0, settings.width, settings.height);
            }
            
            // add the event listener to the element
            child.addEventListener(
                "mousemove", 
                (e) =>{
                    // Canvas bounds
                    const rect = child.getBoundingClientRect();
                    // Set tooltip position left or right side of mouse based on whether cursor is halfway
                    let lrPosition = e.clientX - rect.left > rect.width / 2 ? (e.clientX - rect.left - 56) : (e.clientX - rect.left + 64);
                    tooltip.style.left = lrPosition + "px";
                    // Keep tooltip stable and visible at bottom of palette bounds, otherwise follow cursor
                    let bottomPosition = rect.bottom - e.clientY < 32 ? rect.height - 40 : (e.clientY - rect.top - 8);
                    tooltip.style.top = bottomPosition + "px";

                    const hex = getCanvasHex(e, rect);
                    tooltipText.setText(hex.toUpperCase());
                }
            );

            child.onClickEvent((e) => {
                // Canvas bounds
                const rect = child.getBoundingClientRect();
                const hex = getCanvasHex(e, rect);
                new Notice(`Copied ${hex.toUpperCase()}`);
                navigator.clipboard.writeText(hex.toUpperCase())
            });
            
            // Retrieves the hex from the mouse position
            const getCanvasHex = (e: MouseEvent, canvasBounds: DOMRect) => {
                let context = child.getContext('2d', {willReadFrequently: true});
                let x = e.clientX - canvasBounds.left;
                let y = e.clientY - canvasBounds.top;
                let [r, g, b, a] = context?.getImageData(x, y, 1, 1).data || [0, 0, 0, 0];
                // Convert alpha from 0-255 to 0-1
                const aConv = Math.round((a/255) * 100);
                // Hide alpha value if not an alpha color
                let hex = aConv !== 255 ? colorsea([r, g, b, aConv]).hex() : colorsea([r, g, b]).hex();
                return hex;
            }

            // Loop through colors but skip last one
            for(const [i, color] of Object.entries(colors).filter((e, i) => i !== colors.length - 1)){
                // toggle gradient css class
                child.toggleClass('gradient', settings.gradient);
                // set --palette-background-color css variable
                child.style.setProperty('--palette-background-color', `${color}, ${colors[Number(i) + 1] || 'transparent'}`);
                // set --palette-column-flex-basis css variable
                child.style.setProperty('--palette-column-flex-basis', (settings.height / colors.length / 2).toString() + 'px');
            }
        }
        
        function createColorPalette(containerEl: HTMLElement, colors: string[], paletteHeight: number, aliasMode: AliasMode){
            for(const [i, color] of colors.entries()){
                const csColor = colorsea(color.trim());
    
                let child = containerEl.createEl('div');
                // set --palette-background-color css variable
                child.style.setProperty('--palette-background-color', color);
                // set --palette-column-flex-basis css variable
                child.style.setProperty('--palette-column-flex-basis', (paletteHeight / colors.length / 2).toString() + 'px');
                
                // Display hex if alias mode is set to both OR if alias is not set
                if(aliasMode === AliasMode.Both || settings.aliases[i] == null || settings.aliases[i].trim() === ''){
                    let childText = child.createEl('span', { text: color.toUpperCase() });
                    childText.style.setProperty('--palette-color', (csColor.rgb()[0]*0.299 + csColor.rgb()[1]*0.587 + csColor.rgb()[2]*0.114) > 186 ? '#000000' : '#ffffff');
                }
                let childAlias = child.createEl('span', { text: settings.aliases[i] });
                childAlias.style.setProperty('--palette-color', (csColor.rgb()[0]*0.299 + csColor.rgb()[1]*0.587 + csColor.rgb()[2]*0.114) > 186 ? '#000000' : '#ffffff');
    
                child.onClickEvent((e) => {
                    new Notice(`Copied ${color}`);
                    navigator.clipboard.writeText(color)
                });
            }
        }
    }

    /**
     * Create invalid palette based on palette status
     * @param type Palette status type
     * @param message Custom message
     */
    public createInvalidPalette(type: Status, message = ''){
        this.containerEl.style.setProperty('--palette-height', '150px');
        const invalidSection = this.containerEl.createEl('section');
        invalidSection.toggleClass('invalid', true);
        const invalidSpan = invalidSection.createEl('span');
        const colors = this.colors.toString() !== '' ? this.colors.toString() : this.input;
        const split =  this.input.split('\n');
        const settings = split[split.length - 1];

        switch(type) {
            case Status.INVALID_COLORS:
                invalidSpan.setText(Status.INVALID_COLORS);
                new Notice(message ? message : `Palette:\nColors are defined incorrectly\n${colors}`, this.pluginSettings.noticeDuration);
                break;
            case Status.INVALID_SETTINGS:
                invalidSpan.setText(Status.INVALID_SETTINGS);
                new Notice(message ? message : `Palette:\nIssues parsing settings\n${settings}`, this.pluginSettings.noticeDuration);
                break;
            case Status.INVALID_COLORS_AND_SETTINGS:
                invalidSpan.setText(Status.INVALID_COLORS_AND_SETTINGS);
                new Notice(message ? message : `Palette:\nColors and settings are defined incorrectly\n${this.input}`, this.pluginSettings.noticeDuration);
                break;
            case Status.INVALID_GRADIENT:
                invalidSpan.setText(Status.INVALID_GRADIENT);
                new Notice(message ? message : `Palette:\nGradients require more than 1 color to display\n${colors}`, this.pluginSettings.noticeDuration);
        }
        
        // Pulse the Invalid Palette to show its location
        if(this.pluginSettings.errorPulse){
            this.containerEl.style.setProperty('--notice-duration', ((this.pluginSettings.noticeDuration / 1000) / 2).toString() + 's')
            this.containerEl.toggleClass('palette-pulse', true);
            setTimeout(() => this.containerEl.toggleClass('palette-pulse', false), this.pluginSettings.noticeDuration);
        }
    }
}

class PaletteError extends Error {
    status: Status;
    message: string;
    
    constructor(status: Status, message = '') {
        super(message);
        this.status = status;
    }
}