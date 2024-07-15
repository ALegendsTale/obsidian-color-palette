import colorsea from "colorsea";
import { ButtonComponent } from "obsidian";
import { AliasMode, Direction } from "settings";
import { getForegroundColor } from "utils/basicUtils";

type PaletteItemSettings = {
    aliasMode: AliasMode,
    hoverWhileEditing: boolean,
    height: number,
    direction: Direction,
    hover: boolean,
    alias: string,
    editMode: boolean,
    colorCount: number,
}

export class PaletteItem {
    container: HTMLDivElement;
    color: string;
    settings: PaletteItemSettings;
    private onClick: (e: MouseEvent) => void;
    private onTrash: (e: MouseEvent) => void;
    private onAlias: (alias: string) => void;

    constructor(container: HTMLElement, color: string, settings: PaletteItemSettings, onClick: (e: MouseEvent) => void, onTrash: (e: MouseEvent) => void, onAlias: (alias: string) => void){
        this.container = container.createEl('div');
        this.color = color.trim();
        this.settings = settings;
        this.onClick = onClick;
        this.onTrash = onTrash;
        this.onAlias = onAlias;

        this.load();
    }

    private load() {
        const csColor = colorsea(this.color);
        
        // set background color
        this.container.style.setProperty('--palette-background-color', this.color);
        // set width
        this.container.style.setProperty('--palette-column-flex-basis', (this.settings.height / this.settings.colorCount / 2).toString() + 'px');


        const incompatibleSettings = this.settings.direction === Direction.Row;
        // Create if edit mode is active & if there are incompatibleSettings
        if(this.settings.editMode && !incompatibleSettings) {
            new EditMode(this.container, this.color, this.settings, (e) => this.onTrash(e), (alias) => this.onAlias(alias));
        }
        else {
            // Display hex if alias mode is set to both OR if alias is not set
            if(this.settings.aliasMode === AliasMode.Both || this.settings.alias == null || this.settings.alias.trim() === ''){
                let childText = this.container.createEl('span', { text: this.color.toUpperCase() });
                childText.style.setProperty('--palette-color', getForegroundColor(csColor));
            }

            let childAlias = this.container.createEl('span', { text: this.settings.alias });
            childAlias.style.setProperty('--palette-color', getForegroundColor(csColor));
        }

        this.container.addEventListener('click', (e) => this.onClick(e));
    }
}

class EditMode {
    container: HTMLDivElement;
    span: HTMLSpanElement;
    trash: ButtonComponent;
    storedAlias: string;
    color: string;
    settings: PaletteItemSettings;
    private onTrash: (e: MouseEvent) => void;
    private onAlias: (alias: string) => void;

    constructor(colorContainer: HTMLDivElement, color: string, settings: PaletteItemSettings, onTrash: (e: MouseEvent) => void, onAlias: (alias: string) => void) {
        this.color = color;
        this.settings = settings;
        this.onTrash = onTrash;
        this.onAlias = onAlias;

        const csColor = colorsea(color);
        const contrastColor = getForegroundColor(csColor);

        this.container = colorContainer.appendChild(createEl('div'));
        this.container.addClass('edit-container');
        this.container.style.setProperty('--edit-background-color', color);
        this.container.style.setProperty('--edit-color', contrastColor);

        this.span = this.container.createEl('span');
        this.span.setText(settings.alias || color.toUpperCase());
        this.span.style.setProperty('--edit-font-size', `${this.getAdjustedFontSize(settings.colorCount)}px`);

        this.trash = new ButtonComponent(this.container)
            .setIcon('trash-2')
            .setTooltip('Remove')
            .onClick((e) => this.onTrash(e))
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
        // Remove alias on right click
        this.span.addEventListener('contextmenu', (e) => {
            e.stopPropagation();
            this.span.setText(this.color.toUpperCase());
            this.settings.alias = '';
            this.onAlias(this.settings.alias);
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
        else if(this.span.getText() !== this.color) {
            this.settings.alias = this.span.getText();
            this.onAlias(this.settings.alias);
        }
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
    getAdjustedFontSize(colorsCount: number) {
        const minFontSize = 10;
        const baseFontSize = 16;
        return Math.max(minFontSize, baseFontSize - colorsCount);
    }
}