import { Notice, Platform } from "obsidian";
import colorsea from 'colorsea';
import { Direction, AliasMode, ColorPaletteSettings } from "settings";
import { pluginToPaletteSettings } from "utils/basicUtils";

export type PaletteSettings = {
    height: number
    width: number
    direction: Direction
    gradient: boolean
    hover: boolean
    override: boolean
    aliases: string[]
}

export enum Status {
    VALID = 'Valid',
    INVALID_COLORS = 'Invalid Colors',
    INVALID_SETTINGS = 'Invalid Settings',
    INVALID_COLORS_AND_SETTINGS = 'Invalid Colors & Settings',
    INVALID_GRADIENT = 'Invalid Gradient'
}

export class Palette {
    containerEl: HTMLElement;
    pluginSettings: ColorPaletteSettings;
	colors: string[];
    settings: PaletteSettings;
    status: Status
    resizeObserver: ResizeObserver

	constructor(colors: string[] | Status, settings: PaletteSettings | Status, containerEl: HTMLElement, pluginSettings: ColorPaletteSettings) {
        this.containerEl = containerEl;
        this.pluginSettings = pluginSettings;
        this.setDefaults(colors, settings);
        this.load();

        // Refresh gradient palettes when Obsidian resizes
        this.resizeObserver = new ResizeObserver((palettes) => {
            for (const palette of palettes) {
                for (const children of Array.from(palette.target.children)) {
                    if ( children.nodeName === 'CANVAS') {
                        this.reload();
                    }
                }  
            }
        })
        this.resizeObserver.observe(this.containerEl);
	}

    /**
     * Sets the initial defaults
     */
    public setDefaults(colors: string[] | Status, settings: PaletteSettings | Status) {
        this.status = Status.VALID;
        // Settings are invalid
        if(typeof settings === 'string') {
            this.settings = pluginToPaletteSettings(this.pluginSettings);
            this.status = Status.INVALID_SETTINGS;
        }
        // Settings are valid
        if(typeof settings === 'object') {
            this.settings = {...pluginToPaletteSettings(this.pluginSettings), ...settings};
        }
        // Colors are invalid
        if(typeof colors === 'string') {
            this.colors = [];
            // Set status to Invalid Colors & Settings if colors were also invalid
            this.status = this.status === Status.INVALID_SETTINGS ? Status.INVALID_COLORS_AND_SETTINGS : Status.INVALID_COLORS;
        }
        // Colors are valid
        if(typeof colors === 'object') {
            this.colors = colors;
        }
        // Set default corner style
        this.containerEl.style.setProperty('--palette-corners', this.pluginSettings.corners ? '5px' : '0px');
    }

    /**
     * Loads the palette
     */
    public load() {
        // Create new palette
        this.createPalette(this.colors, this.settings);
	}

    /**
     * Removes palette contents
     */
    public unload(){
        // Remove palette contents
        this.containerEl.empty();
    }

    /**
     * Reloads the palette contents
     */
    public reload(){
        this.unload();
        this.setDefaults(this.colors, this.settings);
        this.load();
    }
    
    /**
     * Create new palette contents based on colors & settings
     * @param colors 
     * @param settings 
     */
    private createPalette(colors: string[], settings: PaletteSettings){
        this.containerEl.addClass('palette')
        this.containerEl.style.setProperty('--palette-direction', settings.direction === Direction.Row ? Direction.Column : Direction.Row);
        this.containerEl.style.setProperty('--not-palette-direction', settings.direction);
        this.containerEl.style.setProperty('--palette-height', `${settings.height}px`);
        this.containerEl.toggleClass('paletteHover', settings.hover);

        try{
            // Throw error & create Invalid Palette
            if(this.status !== Status.VALID) throw new PaletteError(this.status);
            this.settings.gradient ?
            createGradientPalette(this.containerEl, colors, settings, this.pluginSettings.width)
            :
            createColorPalette(this.containerEl, colors, settings.height, this.pluginSettings.aliasMode);
        }
        catch(err){
            if(err instanceof PaletteError)
            this.createInvalidPalette(err.status);
            else
            new Notice(err);
        }

        function createGradientPalette(containerEl: HTMLElement, colors: string[], settings: PaletteSettings, defaultWidth: number){
            if(colors.length <= 1) throw new PaletteError(Status.INVALID_GRADIENT);
            let child = containerEl.createEl('canvas');

            // Set Canvas width to parent width, unless width is set by user
            let gradientWidth = settings.width === defaultWidth ? containerEl.offsetWidth : settings.width;

            child.width = gradientWidth;
            child.height = settings.height;

            const tooltip = containerEl.createEl('section');
            tooltip.addClasses(['tooltip', 'palette-tooltip']);
            const tooltipText = tooltip.createEl('span');

            let context = child.getContext('2d', {willReadFrequently: true});
            if(context != null){
                let gradient = settings.direction === Direction.Column ? context.createLinearGradient(0, 0, gradientWidth, 0) : context.createLinearGradient(0, 0, 0, settings.height);

                for(const[i, color] of colors.entries()){
                    gradient.addColorStop(i / (colors.length - 1), color);
                }

                context.fillStyle = gradient || '#000';
                context.fillRect(0, 0, gradientWidth, settings.height);
            }
            
            // Check if mobile & add the event listener to the element to track position for the tooltip
            if(!Platform.isMobile) child.addEventListener("mousemove", (e) => setTooltipPosition(e.clientX, e.clientY));
            else child.addEventListener("touchmove", (e) => setTooltipPosition(e.touches[0].clientX, e.touches[0].clientY));

            /**
             * Sets the tooltip position based on current cursor or touch position
             */
            function setTooltipPosition(clientX: number, clientY: number) {
                // Canvas bounds
                const rect = child.getBoundingClientRect();

                // Get tooltip bounds
                let tooltipWidth = tooltip.offsetWidth;
                let tooltipHeight = tooltip.offsetHeight;

                // Set tooltip position left or right side of mouse based on whether cursor is halfway
                let leftPosition = clientX - rect.left > rect.width / 2 ? (clientX - rect.left - 56) : (clientX - rect.left + 64);
                let halfTooltipWidth = tooltipWidth / 2;
                // Clamp to left edge
                if (leftPosition < 0 + halfTooltipWidth) leftPosition = 0 + halfTooltipWidth;
                else if (leftPosition + tooltipWidth > rect.width + halfTooltipWidth) leftPosition = rect.width - tooltipWidth + halfTooltipWidth;
                tooltip.style.left = leftPosition + "px";

                // Get cursor position & align tooltip centered to cursor (1/4 tooltip height)
                let topPosition = clientY - rect.top - (tooltipHeight / 4);
                // Clamp to top edge
                if (topPosition < 0) topPosition = 0;
                // Clamp to bottom edge
                else if (topPosition + tooltipHeight > rect.height) topPosition = rect.height - tooltipHeight;
                tooltip.style.top = topPosition + "px";

                const hex = getCanvasHex(clientX, clientY, rect);
                tooltipText.setText(hex.toUpperCase());
            }

            child.onClickEvent((e) => {
                // Canvas bounds
                const rect = child.getBoundingClientRect();
                const hex = getCanvasHex(e.clientX, e.clientY, rect);
                new Notice(`Copied ${hex.toUpperCase()}`);
                navigator.clipboard.writeText(hex.toUpperCase())
            });
            
            // Retrieves the hex from the mouse position
            const getCanvasHex = (clientX: number, clientY: number, canvasBounds: DOMRect) => {
                let context = child.getContext('2d', {willReadFrequently: true});
                let x = clientX - canvasBounds.left;
                let y = clientY - canvasBounds.top;
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
     */
    private createInvalidPalette(type: Status){
        this.containerEl.style.setProperty('--palette-height', '150px');
        const invalidSection = this.containerEl.createEl('section');
        invalidSection.toggleClass('invalid', true);
        const invalidSpan = invalidSection.createEl('span');

        switch(type) {
            case Status.INVALID_COLORS:
                invalidSpan.setText(Status.INVALID_COLORS);
                new Notice(`Palette:\nColors are defined incorrectly`, this.pluginSettings.noticeDuration);
                break;
            case Status.INVALID_SETTINGS:
                invalidSpan.setText(Status.INVALID_SETTINGS);
                new Notice(`Palette:\nIssues parsing settings`, this.pluginSettings.noticeDuration);
                break;
            case Status.INVALID_COLORS_AND_SETTINGS:
                invalidSpan.setText(Status.INVALID_COLORS_AND_SETTINGS);
                new Notice(`Palette:\nColors and settings are defined incorrectly`, this.pluginSettings.noticeDuration);
                break;
            case Status.INVALID_GRADIENT:
                invalidSpan.setText(Status.INVALID_GRADIENT);
                new Notice(`Palette:\nGradients require more than 1 color to display`, this.pluginSettings.noticeDuration);
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