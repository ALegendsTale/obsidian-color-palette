import { Notice } from "obsidian";
import { Direction, AliasMode, ColorPaletteSettings } from "settings";
import { pluginToPaletteSettings } from "utils/basicUtils";
import { PaletteItem } from "palette/PaletteItem";
import { DragDrop } from "utils/dragDropUtils";
import { Canvas } from "utils/canvasUtils";

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
    showNotice: boolean
    private editMode: boolean;
    dragDrop: DragDrop | null;
    dropzone: HTMLDivElement;
    paletteItems: PaletteItem[];
    onChange: (colors: string[], settings: PaletteSettings) => void;
    onEditMode: (editMode: boolean) => void;

	constructor(colors: string[] | Status, settings: PaletteSettings | Status, containerEl: HTMLElement, pluginSettings: ColorPaletteSettings, onChange: (colors: string[], settings: PaletteSettings) => void, onEditMode: (editMode: boolean) => void, editMode = false) {
        this.containerEl = containerEl;
        this.containerEl.addClass('palette-container');
        this.pluginSettings = pluginSettings;
        this.showNotice = true;
        this.editMode = editMode;
        this.paletteItems = [];
        this.onChange = onChange;
        this.onEditMode = onEditMode;

        this.setDefaults(colors, settings);
        this.load();

        // Refresh gradient palettes when Obsidian resizes
        const resizeObserver = new ResizeObserver((palettes) => {
                const dropzone = palettes[0].target.children[0];
                for (const child of Array.from(dropzone.children)) {
                    // Check if child is a canvas element
                    if ( child.nodeName === 'CANVAS') {
                        this.reload(true);
                    }
                }  
            }
        )
        resizeObserver.observe(this.containerEl);
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
    }

    /**
     * Loads the palette
     */
    public load() {
        // Create new palette
        this.createPalette(this.colors, this.settings);

        // Adds Drag & Drop to palettes in edit mode which are not gradients
        if(this.editMode && !this.settings.gradient){
            this.dropzone.toggleClass('palette-hover', this.pluginSettings.hoverWhileEditing ? this.settings.hover : false);

            this.dragDrop = new DragDrop([this.dropzone], Array.from(this.dropzone.children), (e, res) => {
                // Sort palette items according to drop order
                this.paletteItems.sort((a, b) => {
                    return res.order.indexOf(a.container) - res.order.indexOf(b.container);
                });
                this.colors = this.paletteItems.map((item) => item.color);
                this.settings.aliases = this.paletteItems.map((item) => item.settings.alias);
                this.onChange(this.colors, this.settings);
                this.reload();
            });
        }

        // Add edit-mode class if set on load
        this.dropzone.toggleClass('edit-mode', this.editMode);
	}

    /**
     * Removes palette contents
     */
    public unload(){        
        // Remove palette contents
        this.containerEl.empty();
        this.paletteItems = [];
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

    public setEditMode(editMode: boolean) {
        this.editMode = editMode;
        this.onEditMode(editMode);
    }

    public getEditMode(): boolean {
        return this.editMode;
    }
    
    /**
     * Create new palette contents based on colors & settings
     * @param colors 
     * @param settings 
     */
    private createPalette(colors: string[], settings: PaletteSettings){
        this.dropzone = this.containerEl.createEl('div');
        this.dropzone.addClass('palette')
        // Set default corner style
        this.dropzone.style.setProperty('--palette-corners', this.pluginSettings.corners ? '5px' : '0px');
        this.dropzone.style.setProperty('--palette-direction', settings.direction === Direction.Row ? Direction.Column : Direction.Row);
        this.dropzone.style.setProperty('--not-palette-direction', settings.direction);
        this.dropzone.style.setProperty('--palette-height', `${settings.height}px`);
        // Ensure parent width is never 0
        const parentWidth = this.dropzone.offsetWidth !== 0 ? this.dropzone.offsetWidth : settings.width;
        // Set width to parent width, unless set by user
        let paletteWidth = settings.width === this.pluginSettings.width ? parentWidth : settings.width;
        this.dropzone.style.setProperty('--palette-width', `${paletteWidth}px`);
        this.dropzone.toggleClass('palette-hover', settings.hover);

        try{
            // Throw error & create Invalid Palette
            if(this.status !== Status.VALID) throw new PaletteError(this.status);
            this.settings.gradient ?
            this.createGradientPalette(this.dropzone, colors, settings, paletteWidth)
            :
            this.createColorPalette(this.dropzone, colors, settings, this.pluginSettings.aliasMode);
        }
        catch(err){
            if(err instanceof PaletteError) this.createInvalidPalette(err.status, err.message);
            else this.createNotice(err);
        }
    }

    private createGradientPalette(containerEl: HTMLElement, colors: string[], settings: PaletteSettings, paletteWidth: number){
        if(colors.length <= 1) throw new PaletteError(Status.INVALID_GRADIENT);

        const canvas = new Canvas(containerEl);

        try {
            canvas.createGradient(colors, paletteWidth, settings.height, settings.direction, (hex, e) => {
                new Notice(`Copied ${hex.toUpperCase()}`);
                navigator.clipboard.writeText(hex.toUpperCase())
            });
        }
        catch(e) {
            throw new PaletteError(Status.INVALID_GRADIENT, e);
        }
    }

    private createColorPalette(containerEl: HTMLElement, colors: string[], settings: PaletteSettings, aliasMode: AliasMode){
        for(const [i, color] of colors.entries()){
            const paletteItem = new PaletteItem(containerEl, color, 
                { 
                    aliasMode: aliasMode, 
                    editMode: this.editMode, 
                    hoverWhileEditing: this.pluginSettings.hoverWhileEditing, 
                    height: settings.height, 
                    direction: settings.direction,
                    hover: settings.hover, 
                    alias: settings.aliases?.[i] || '',
                    colorCount: colors.length,
                },
                // onClick
                (e: MouseEvent) => {
                    this.createNotice(`Copied ${color}`);
                    navigator.clipboard.writeText(color);
                },
                // onTrash
                (e: MouseEvent) => {
                    e.stopPropagation();
                    const deletedIndex = this.colors.indexOf(color);
                    let colors = this.colors;
                    let settings = this.settings;
                    colors.splice(deletedIndex, 1);
                    settings.aliases.splice(deletedIndex, 1);
                    this.onChange(colors, settings);
                    this.reload();
                },
                // onAlias
                (alias) => {
                    this.settings.aliases[this.colors.findIndex(val => val === color)] = alias;
                }
            );
            this.paletteItems.push(paletteItem);
        }
    }

    /**
     * Create invalid palette based on palette status
     * @param type Palette status type
     */
    private createInvalidPalette(type: Status, message = ''){
        this.status = type;
        this.dropzone.style.setProperty('--palette-height', '150px');
        this.dropzone.style.setProperty('--palette-width', `100%`);
        const invalidSection = this.dropzone.createEl('section');
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