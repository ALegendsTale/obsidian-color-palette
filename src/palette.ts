import { MarkdownRenderChild, Notice } from "obsidian";
import colorsea from 'colorsea';
import { urlRegex } from "./main";
import { ColorPaletteSettings } from "./settings";

export class Palette extends MarkdownRenderChild {
    settings: ColorPaletteSettings;
	input: string;
	colors: string[];
    invalidPalette: boolean;
    handleMouseOver: () => void;
    handleMouseOut: () => void;

	constructor(settings: ColorPaletteSettings, containerEl: HTMLElement, input: string) {
	  super(containerEl);
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

        this.invalidPalette = this.colors[0] === "Invalid Palette";

        this.createPalette();
	}

    onunload() {
        this.removePaletteListeners();
    }

    public removePaletteListeners(){
        this.containerEl.childNodes.forEach((child) => {
            if(this.handleMouseOver == null || this.handleMouseOut == null) return;
            child.removeEventListener('mouseover', this.handleMouseOver);
            child.removeEventListener('mouseout', this.handleMouseOut);
        })
    }

    public refresh(){
        this.removePaletteListeners();
        this.containerEl.empty();
        this.createPalette()
    }
    
    public createPalette(){
        this.containerEl.setCssStyles({
            width: '100%', 
            height: this.settings.paletteHeight.toString() + 'px', 
            display: 'flex', 
            flexDirection: this.settings.paletteDirection, 
            borderRadius: '5px', 
            overflow: 'hidden',
            cursor: 'pointer'
        })
		for(const color of this.colors){
            const csColor = colorsea(color);

			let child = this.containerEl.createEl('div');
            child.setCssStyles({
                backgroundColor: color, 
                flex: '1', 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                transition: 'all 0.1s ease-in-out'
            });
            
            let childText = child.createEl('span', { text: color.toUpperCase() });
            childText.setCssStyles({
                textAlign: 'center', 
                display: this.invalidPalette ? 'block' : 'none', 
                color: (csColor.rgb()[0]*0.299 + csColor.rgb()[1]*0.587 + csColor.rgb()[2]*0.114) > 186 ? '#000000' : '#ffffff', 
                fontSize: '100%',
                fontWeight: 'bold'
            });

            child.onClickEvent((e) => {
                if(this.invalidPalette) return;
                new Notice(`Copied ${color}`);
                navigator.clipboard.writeText(color)
            })
            this.handleMouseOver = () => {
                if(this.invalidPalette) return;
                child.setCssStyles({
                    flexBasis: this.settings.paletteDirection === 'row' ? 
                    (this.settings.paletteHeight / 2).toString() + 'px'
                    :
                    (child.innerHeight / 2).toString() + 'px'
                });
                childText.setCssStyles({ display: 'block' });
            }
            this.handleMouseOut = () => {
                if(this.invalidPalette) return;
                child.setCssStyles({ flex: '1' });
                childText.setCssStyles({ display: 'none' });
            }
            child.addEventListener('mouseover', this.handleMouseOver);
            child.addEventListener('mouseout', this.handleMouseOut);
		}
    }
}