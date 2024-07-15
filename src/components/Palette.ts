import { Notice } from "obsidian";
import { Direction, AliasMode, ColorPaletteSettings, defaultSettings } from "settings";
import { copyToClipboard, pluginToPaletteSettings } from "utils/basicUtils";
import { PaletteItem } from "./PaletteItem";
import { DragDrop } from "utils/dragDropUtils";
import { Canvas } from "utils/canvasUtils";
import { EventEmitter } from "utils/EventEmitter";

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

type EventMap = {
    resized: [palette: ResizeObserverEntry],
    changed: [colors: string[], settings: PaletteSettings],
    editMode: [editMode: boolean]
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
    paletteCanvas: Canvas | undefined;
    public emitter: EventEmitter<EventMap>;

	constructor(colors: string[] | Status, settings: PaletteSettings | Status | undefined, containerEl: HTMLElement, pluginSettings: ColorPaletteSettings, editMode = false) {
        this.containerEl = containerEl;
        this.containerEl.addClass('palette-container');
        this.pluginSettings = pluginSettings;
        this.status = Status.VALID;
        this.showNotice = true;
        this.editMode = editMode;
        this.paletteItems = [];
        this.emitter = new EventEmitter<EventMap>;

        this.setDefaults(colors, settings);
        this.load();

        let observerDebouncers = new WeakMap;

        // Refresh gradient palettes when Obsidian resizes
        const resizeObserver = new ResizeObserver((palettes) => {
            // There is only one palette
            palettes.forEach((palette) => {
                // Clear timeout on observerDebouncers palette
                clearTimeout(observerDebouncers.get(palette.target));
                // Set a new timeout on palette & store in observerDebouncers
                observerDebouncers.set(palette.target, setTimeout(() => this.emitter.emit('resized', palette), this.pluginSettings.reloadDelay));
            })
        })
        // Tracking containerEl (instead of dropzone) ensures resizeObserver persists through reloads
        resizeObserver.observe(this.containerEl);

        // Resized event after user has stopped dragging
        this.emitter.on('resized', (palette) => this.onResized(palette));
	}

    /**
     * Sets the initial defaults
     */
    public setDefaults(colors: string[] | Status, settings: PaletteSettings | Status | undefined) {
        // Settings are invalid
        if(typeof settings === 'string') {
            this.settings = pluginToPaletteSettings(this.pluginSettings);
            this.status = Status.INVALID_SETTINGS;
        }
        // Settings are valid
        if(typeof settings === 'object') {
            this.settings = {...pluginToPaletteSettings(this.pluginSettings), ...settings};
        }
        // Settings were not set by user
        if(typeof settings === 'undefined') {
            this.settings = pluginToPaletteSettings(this.pluginSettings);
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
                this.emitter.emit('changed', this.colors, this.settings);
                this.reload();
            });
        }

        // Add edit-mode class if set on load
        this.dropzone.toggleClass('edit-mode', this.editMode);
	}

    /**
     * Removes liseteners
     */
    public unload(){
        this.containerEl.empty();
        this.paletteItems = [];
        this.paletteCanvas = undefined;
    }

    /**
     * Reloads the palette contents
     * @param resize Whether the palette is reloading because of a resize (defaults to false)
     */
    public reload(resize: { height: number, width: number } = {height: 0, width: 0}){
        // Check if palette size is zero
        const isZero = resize.height === 0 && resize.width === 0;
        if(!isZero) {
            // Set width if size is not zero
            this.setWidth(this.getPaletteWidth(resize.width));
            return;
        }
        // Only show notice on non-resize reloads
        this.showNotice = !resize;
        this.unload();
        this.setDefaults(this.colors, this.settings);
        this.load();
        this.showNotice = true;
    }

    private onResized(palette: ResizeObserverEntry) {
        const size = {height: palette.contentRect.height, width: palette.contentRect.width};
        // Check if palette size is zero
        const isZero = size.height === 0 && size.width === 0;
        // Resize if size is not zero
        if (!isZero) this.reload({height: size.height, width: size.width});
    }

    /**
     * Sets the width of the palette
     */
    public setWidth(width: number) {
        // Create new gradient if canvas
        if(this.settings.gradient && this.paletteCanvas) this.paletteCanvas.createGradient(this.colors, width, this.settings.height, this.settings.direction);
        // Set palette width
        this.dropzone.style.setProperty('--palette-width', `${width}px`);
        this.containerEl.toggleClass('palette-scroll', width > defaultSettings.width);
    }

    /**
     * @returns `user` OR `auto` width based on which is more approperiate
     */
    public getPaletteWidth(resizeOffset = 0) {
        const paletteOffset = resizeOffset !== 0 ? resizeOffset : this.dropzone.offsetWidth;
        // Set user-set width if it is greater than the default width
        if(this.settings.width > defaultSettings.width) return this.settings.width;
        // Automatically set width if offset is less than settings width
        if(paletteOffset < this.settings.width && paletteOffset > 0) return paletteOffset;
        // Set user-set width
        else return this.settings.width;
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
        this.emitter.emit('editMode', editMode);
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
        this.dropzone.toggleClass('palette-hover', settings.hover);

        try{
            // Throw error & create Invalid Palette
            if(this.status !== Status.VALID) throw new PaletteError(this.status);
            this.settings.gradient ?
            this.createGradientPalette(this.dropzone, colors)
            :
            this.createColorPalette(this.dropzone, colors, settings, this.pluginSettings.aliasMode);

            // Set width of palettes
            this.setWidth(this.getPaletteWidth());
        }
        catch(err){
            if(err instanceof PaletteError) this.createInvalidPalette(err.status, err.message);
            else this.createNotice(err);
        }
    }

    private createGradientPalette(container: HTMLElement, colors: string[]){
        if(colors.length <= 1) throw new PaletteError(Status.INVALID_GRADIENT);

        this.paletteCanvas = new Canvas(container);
        this.paletteCanvas.emitter.on('click', (hex) => copyToClipboard(hex));
    }

    private createColorPalette(container: HTMLElement, colors: string[], settings: PaletteSettings, aliasMode: AliasMode){
        for(const [i, color] of colors.entries()){
            const paletteItem = new PaletteItem(container, color, 
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
                    this.emitter.emit('changed', colors, settings);
                    this.reload();
                },
                // onAlias
                (alias) => {
                    // Get the index of the alias relative to the PaletteItem color
                    const aliasIndex = this.colors.findIndex(val => val === color);
                    for(let i = 0; i < aliasIndex; i++) {
                        // Set empty strings to empty indexes
                        if(!this.settings.aliases[i]) this.settings.aliases[i] = '';
                    }
                    // Set modified alias index
                    this.settings.aliases[aliasIndex] = alias;
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
            this.dropzone.style.setProperty('--notice-duration', ((this.pluginSettings.noticeDuration / 1000) / 2).toString() + 's')
            this.dropzone.toggleClass('palette-pulse', true);
            setTimeout(() => this.dropzone.toggleClass('palette-pulse', false), this.pluginSettings.noticeDuration);
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