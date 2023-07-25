import { MarkdownRenderChild, Notice } from "obsidian";
import colorsea from 'colorsea';
import ColorPalette, { urlRegex } from "./main";
import { ColorPaletteSettings } from "./settings";

export class Palette extends MarkdownRenderChild {
    plugin: ColorPalette;
    settings: ColorPaletteSettings;
	input: string;
	colors: string[];

	constructor(plugin: ColorPalette, settings: ColorPaletteSettings, containerEl: HTMLElement, input: string) {
	  super(containerEl);
      this.plugin = plugin;
      this.settings = settings;
	  this.input = input;
	  this.colors = [];
	}
  
	onload() {
		// Check if link & contains dashes (coolor url)
		this.input.match(urlRegex) && this.input.contains('-') ? 
        this.colors = this.input.substring(this.input.lastIndexOf('/') + 1).split('-').map(i => '#' + i)
		:
        // Check if link (colorhunt)
        this.input.match(urlRegex) ?
        this.colors = this.input.substring(this.input.lastIndexOf('/') + 1).match(/.{1,6}/g)?.map(i => '#' + i) || ['Invalid Palette']
        :
        // Check for comma newline
        this.input.contains(',\n') ?
        this.colors = this.input.split(',\n')
        :
        // Check for just newline
        this.input.contains('\n') ?
        this.colors = this.input.split('\n')
        :
        // Just comma
        this.input.contains(',') ?
        this.colors = this.input.split(',')
        :
        // Check if hex color
        this.input.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i) ?
        this.colors[0] = this.input
        :
        // Not matching
        this.colors[0] = 'Invalid Palette'

        // Add new palette to state
        if(this.colors[0] !== 'Invalid Palette'){
            this.plugin.palettes?.push(this);
        }

        this.createPalette();
	}

    unload() {
        // Remove palette from state
        if(this.colors[0] !== 'Invalid Palette'){
            this.plugin.palettes?.remove(this);
        }
    }

    public refresh(){
        this.containerEl.empty();
        this.createPalette()
    }
    
    public createPalette(){
        this.containerEl.addClass('palette')
        this.containerEl.toggleClass('paletteColumn', this.settings.paletteDirection === 'column');
        // set --palette-height css variable
        this.containerEl.style.setProperty('--palette-height', this.settings.paletteHeight.toString() + 'px')
		for(const color of this.colors){
            const csColor = colorsea(color);

			let child = this.containerEl.createEl('div');
            // set --palette-background-color css variable
            child.style.setProperty('--palette-background-color', color);
            // set --palette-column-flex-basis css variable
            child.style.setProperty('--palette-column-flex-basis', (this.settings.paletteHeight / this.colors.length / 2).toString() + 'px');

            const invalidPalette =  this.colors[0] === "Invalid Palette"
            
            let childText = child.createEl('span', { text: color.toUpperCase() });
            childText.toggleClass('invalid', invalidPalette);
            // set --palette-color css variable
            childText.style.setProperty(
                '--palette-color', 
                (csColor.rgb()[0]*0.299 + csColor.rgb()[1]*0.587 + csColor.rgb()[2]*0.114) > 186 ? '#000000' : '#ffffff'
            )

            child.onClickEvent((e) => {
                if(invalidPalette) return;
                new Notice(`Copied ${color}`);
                navigator.clipboard.writeText(color)
            });
		}
    }
}