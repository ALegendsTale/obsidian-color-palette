import { MarkdownRenderChild, Notice } from "obsidian";
import colorsea from 'colorsea';
import ColorPalette, { urlRegex } from "./main";
import { ColorPaletteSettings } from "./settings";

export type PaletteSettings = {
    gradient: boolean
    height: number
    width: number
    direction: direction
}

export type direction = 
    | 'row' 
    | 'column'

type Validity = 
    | "Valid"
    | "Invalid Colors"
    | "Invalid Settings"
    | "Invalid Colors & Settings"

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
    validity: Validity

	constructor(plugin: ColorPalette, settings: ColorPaletteSettings, containerEl: HTMLElement, input: string) {
        super(containerEl);
        this.plugin = plugin;
        this.pluginSettings = settings;
        this.input = input;
        this.colors = [];
        this.settings = {gradient: false, height: 150, width: 700, direction: "column"};
        this.validity = "Valid";
	}
  
	onload() {
        // Combines regex to create full palette validation regex (should end up being same as fullRegex const)
        const paletteRegex = new RegExp(`^(?:${colorsRegex.source}|${urlRegex.source})(?<!,|,\s*)$`);
        let split = this.input.split('\n')
        // Trim in case there are trailing whitespaces the user added to the last hex code.
        let rawColors = split[0]?.trim()
        // Set local settings if specified
        if(split.length === 2){
            try {
                // Extract JSON settings from the palette
                const parsedSplit: PaletteSettings = JSON.parse(split[1]);
                this.settings = {...this.settings, ...parsedSplit};
            } catch (error) {
                this.validity = "Invalid Settings";
            }
        }
        // Check for invalid Palette
        rawColors.match(paletteRegex) === null ?
        // Set validity to Invalid Colors & Settings if settings were deemed invalid
        this.validity === "Invalid Settings" ? this.validity = "Invalid Colors & Settings" : this.validity = "Invalid Colors"
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

        // Add new palette to state
        if(this.validity === "Valid") this.plugin.palettes?.push(this);

        // Create new palette
        this.createPalette(this.colors, this.settings);
        // Create invalid palette if not valid
        if(this.validity !== "Valid") this.createInvalidPalette(this.validity, rawColors);
	}

    unload() {
        // Remove palette from state
        if(this.validity === "Valid") this.plugin.palettes?.remove(this);
    }

    public refresh(){
        this.containerEl.empty();
        this.createPalette(this.colors, this.settings)
    }
    
    public createPalette(colors: string[], settings: PaletteSettings){
        this.containerEl.addClass('palette')
        this.containerEl.toggleClass('paletteColumn', settings.direction === 'row');
        // set --palette-height css variable
        this.containerEl.style.setProperty('--palette-height', `${settings.height}px`);

        this.settings.gradient ?
        createGradientPalette(this.containerEl, colors, settings)
        :
        createColorPalette(this.containerEl, colors, settings.height);

        function createGradientPalette(containerEl: HTMLElement, colors: string[], settings: PaletteSettings){
            let child = containerEl.createEl('canvas');
            child.width = settings.width;
            child.height = settings.height;

            const tooltip = containerEl.createEl('section');
            tooltip.addClass('tooltip');
            const tooltipText = tooltip.createEl('span');

            let context = child.getContext('2d', {willReadFrequently: true});
            if(context != null){
                let gradient = settings.direction === 'column' ? context.createLinearGradient(0, 0, settings.width, 0) : context.createLinearGradient(0, 0, 0, settings.height);

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
        
        function createColorPalette(containerEl: HTMLElement, colors: string[], paletteHeight: number){
            for(const [i, color] of colors.entries()){
                const csColor = colorsea(color.trim());
    
                let child = containerEl.createEl('div');
                // set --palette-background-color css variable
                child.style.setProperty('--palette-background-color', color);
                // set --palette-column-flex-basis css variable
                child.style.setProperty('--palette-column-flex-basis', (paletteHeight / colors.length / 2).toString() + 'px');
                
                let childText = child.createEl('span', { text: color.toUpperCase() });
                // set --palette-color css variable
                childText.style.setProperty('--palette-color', (csColor.rgb()[0]*0.299 + csColor.rgb()[1]*0.587 + csColor.rgb()[2]*0.114) > 186 ? '#000000' : '#ffffff');
    
                child.onClickEvent((e) => {
                    new Notice(`Copied ${color}`);
                    navigator.clipboard.writeText(color)
                });
            }
        }
    }

    public createInvalidPalette(type: Validity, rawColors: string){
        this.containerEl.style.setProperty('--palette-height', `${this.settings.height}px`);
        const invalidSection = this.containerEl.createEl('section');
        invalidSection.toggleClass('invalid', true);

        switch(type) {
            case "Invalid Colors":
                invalidSection.createEl('span', {text: 'Invalid Colors'});
                new Notice(`Palette ${rawColors} colors are defined incorrectly`, this.pluginSettings.noticeDuration);
                break;
            case "Invalid Settings":
                invalidSection.createEl('span', {text: 'Invalid Settings'});
                new Notice(`Palette ${rawColors} had issues parsing settings`, this.pluginSettings.noticeDuration);
                break;
            case "Invalid Colors & Settings":
                invalidSection.createEl('span', {text: 'Invalid Colors & Settings'});
                new Notice(`Palette colors and settings defined incorrectly. Please check again`, this.pluginSettings.noticeDuration);
                break;
        }
    }
}