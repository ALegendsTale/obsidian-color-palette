import { ButtonComponent, Notice, Platform } from "obsidian";
import colorsea from 'colorsea';
import { Direction, AliasMode, ColorPaletteSettings } from "settings";
import { getForegroundColor, pluginToPaletteSettings } from "utils/basicUtils";
import validateColor from "validate-color";

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
    showNotice: boolean
    editMode: boolean;

	constructor(colors: string[] | Status, settings: PaletteSettings | Status, containerEl: HTMLElement, pluginSettings: ColorPaletteSettings, editMode = false) {
        this.containerEl = containerEl;
        this.pluginSettings = pluginSettings;
        this.showNotice = true;
        this.editMode = editMode;
        this.setDefaults(colors, settings);
        this.load();

        // Refresh gradient palettes when Obsidian resizes
        this.resizeObserver = new ResizeObserver((palettes) => {
            for (const palette of palettes) {
                for (const child of Array.from(palette.target.children)) {
                    // Check if child is a canvas element
                    if ( child.nodeName === 'CANVAS') {
                        this.reload(true);
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
     * @param resize Whether the palette is reloading because of a resize (defaults to false)
     */
    public reload(resize = false){
        // Only show notice on non-resize reloads
        this.showNotice = !resize;
        this.unload();
        this.setDefaults(this.colors, this.settings);
        this.load();
        this.showNotice = true;
    }

    /**
     * Creates a new notice using pre-set settings
     * @param message Message to display
     */
    public createNotice(message: string) {
        this.showNotice && new Notice(message, this.pluginSettings.noticeDuration);
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
        this.containerEl.toggleClass('palette-hover', settings.hover);

        try{
            // Throw error & create Invalid Palette
            if(this.status !== Status.VALID) throw new PaletteError(this.status);
            this.settings.gradient ?
            this.createGradientPalette(this.containerEl, colors, settings, this.pluginSettings.width)
            :
            this.createColorPalette(this.containerEl, colors, settings, this.pluginSettings.aliasMode);
        }
        catch(err){
            if(err instanceof PaletteError) this.createInvalidPalette(err.status, err.message);
            else this.createNotice(err);
        }
    }

    private createGradientPalette(containerEl: HTMLElement, colors: string[], settings: PaletteSettings, defaultWidth: number){
        if(colors.length <= 1) throw new PaletteError(Status.INVALID_GRADIENT);
        let child = containerEl.createEl('canvas');

        // Ensure parent width is never 0
        const parentWidth = containerEl.offsetWidth !== 0 ? containerEl.offsetWidth : settings.width;
        // Set Canvas width to parent width, unless width is set by user
        let gradientWidth = settings.width === defaultWidth ? parentWidth : settings.width;

        child.width = gradientWidth;
        child.height = settings.height;

        const tooltip = containerEl.createEl('section');
        tooltip.addClasses(['tooltip', 'palette-tooltip']);
        const tooltipText = tooltip.createEl('span');

        let context = child.getContext('2d', {willReadFrequently: true});
        if(context != null){
            let gradient = settings.direction === Direction.Column ? context.createLinearGradient(0, 0, gradientWidth, 0) : context.createLinearGradient(0, 0, 0, settings.height);

            let colorStops: string[] = [];
            for(const[i, color] of colors.entries()){
                // Skip non-colors, even with override enabled. This prevents errors, especially dealing with css-variables which cannot be parsed at run-time.
                if(validateColor(color)) {
                    gradient.addColorStop(i / (colors.length - 1), color);
                    colorStops.push(color);
                }
            }

            if(colorStops.length <= 1) throw new PaletteError(Status.INVALID_GRADIENT, 'There are not enough valid color stops to create the gradient.');

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

        child.addEventListener('click', (e) => {
            // Canvas bounds
            const rect = child.getBoundingClientRect();
            const hex = getCanvasHex(e.clientX, e.clientY, rect);
            this.createNotice(`Copied ${hex.toUpperCase()}`);
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

    private createColorPalette(containerEl: HTMLElement, colors: string[], settings: PaletteSettings, aliasMode: AliasMode){
        for(const [i, color] of colors.entries()){
            const csColor = colorsea(color.trim());

            let child = containerEl.createEl('div');
            // set --palette-background-color css variable
            child.style.setProperty('--palette-background-color', color);
            // set --palette-column-flex-basis css variable
            child.style.setProperty('--palette-column-flex-basis', (settings.height / colors.length / 2).toString() + 'px');

            // Create trash only if edit mode is active
            if(this.editMode) {
                this.containerEl.toggleClass('palette-hover', this.pluginSettings.hoverWhileEditing ? settings.hover : false);
                new EditMode(this, child, color);
            }
            else {
                // Display hex if alias mode is set to both OR if alias is not set
                if(aliasMode === AliasMode.Both || settings.aliases[i] == null || settings.aliases[i].trim() === ''){
                    let childText = child.createEl('span', { text: color.toUpperCase() });
                    childText.style.setProperty('--palette-color', getForegroundColor(csColor));
                }

                let childAlias = child.createEl('span', { text: settings.aliases[i] });
                childAlias.style.setProperty('--palette-color', getForegroundColor(csColor));
            }

            child.addEventListener('click', (e) => {
                this.createNotice(`Copied ${color}`);
                navigator.clipboard.writeText(color)
            });
        }
    }

    /**
     * Create invalid palette based on palette status
     * @param type Palette status type
     */
    private createInvalidPalette(type: Status, message = ''){
        this.status = type;
        this.containerEl.style.setProperty('--palette-height', '150px');
        const invalidSection = this.containerEl.createEl('section');
        invalidSection.toggleClass('invalid', true);
        const invalidSpan = invalidSection.createEl('span');

        let defaultMessage = 'Invalid palette';
        switch(type) {
            case Status.INVALID_COLORS:
                invalidSpan.setText(Status.INVALID_COLORS);
                defaultMessage = 'Colors are defined incorrectly';
                this.createNotice(`Palette:\n${message ? message : defaultMessage}`);
                break;
            case Status.INVALID_SETTINGS:
                invalidSpan.setText(Status.INVALID_SETTINGS);
                defaultMessage = 'Issues parsing settings';
                this.createNotice(`Palette:\n${message ? message : defaultMessage}`);
                break;
            case Status.INVALID_COLORS_AND_SETTINGS:
                invalidSpan.setText(Status.INVALID_COLORS_AND_SETTINGS);
                defaultMessage = 'Colors and settings are defined incorrectly';
                this.createNotice(`Palette:\n${message ? message : defaultMessage}`);
                break;
            case Status.INVALID_GRADIENT:
                invalidSpan.setText(Status.INVALID_GRADIENT);
                defaultMessage = 'Gradients require more than 1 color to display';
                this.createNotice(`Palette:\n${message ? message : defaultMessage}`);
                break;
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

class EditMode {
    container: HTMLDivElement;
    span: HTMLSpanElement;
    trash: ButtonComponent;
    palette: Palette;
    storedAlias: string;
    color: string;

    constructor(palette: Palette, colorContainer: HTMLDivElement, color: string) {
        this.color = color;
        this.palette = palette;

        const csColor = colorsea(color);
        const contrastColor = getForegroundColor(csColor);

        this.container = colorContainer.appendChild(createEl('div'));
        this.container.addClass('edit-container');
        this.container.style.setProperty('--edit-background-color', color);
        this.container.style.setProperty('--edit-color', contrastColor);

        this.span = this.container.createEl('span');
        this.span.setText(this.palette.settings.aliases[this.palette.colors.findIndex(val => val === color)] || color.toUpperCase());
        this.span.style.setProperty('--edit-font-size', `${this.getAdjustedFontSize(this.palette.colors)}px`);

        this.trash = new ButtonComponent(this.container)
            .setIcon('trash-2')
            .setTooltip('Remove')
            .onClick((e) => {
                e.stopPropagation();
                const deletedIndex = this.palette.colors.indexOf(color);
                this.palette.colors.splice(deletedIndex, 1);
                this.palette.settings.aliases.splice(deletedIndex, 1);
                this.palette.reload();
            })
        this.trash.buttonEl.addEventListener('mouseover', (e) => {
            this.trash.setCta();
        })
        this.trash.buttonEl.addEventListener('mouseout', (e) => {
            this.trash.removeCta();
        })

        // Focus color & allow for editing alias
        this.span.addEventListener('click', (e) => {
            e.stopPropagation();
            this.setEditable(true);
            this.span.focus();
        })
        this.span.addEventListener('keypress', (e) => {
            if(e.key === 'Enter') {
                this.setAlias();
                this.setEditable(false);
            }
        })
        // Set alias if changed & de-focus
        this.span.addEventListener('focusout', (e) => {
            this.setAlias();
            this.setEditable(false);
        })
        
        this.storedAlias = this.span.getText();
    }

    setAlias() {
        // Reset span text to original if user left it empty
        if(this.span.getText().trim() === '') this.span.setText(this.storedAlias);
        // Set alias color if user modified text
        else if(this.span.getText() !== this.color) this.palette.settings.aliases[this.palette.colors.findIndex(val => val === this.color)] = this.span.getText();
    }

    setEditable(editable: boolean) {
        if(editable === true) {
            this.storedAlias = this.span.getText();
            this.span.setText('');
        }
        this.span.contentEditable = `${editable}`;
        this.span.toggleClass('color-span-editable', editable);
    }

    /**
     * Calculate font size based on number of colors
     */
    getAdjustedFontSize(colors: string[]) {
        const minFontSize = 10;
        const baseFontSize = 16;
        return Math.max(minFontSize, baseFontSize - (colors.length / 2));
    }
}