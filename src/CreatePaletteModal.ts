import { App, Modal, Notice, Setting, setIcon } from "obsidian";
import { PaletteSettings } from "./palette";
import { urlRegex } from "./main";
import colorsea from "colorsea";
import { Direction, ColorPaletteSettings } from "./settings";
import { Combination, generateRandomColors } from "./utils/generateRandom";

export class CreatePaletteModal extends Modal {
    result: string;
    url: string;
    settings: PaletteSettings
    colors: string[]
    colorContainers: HTMLDivElement[]
    combination: Combination
    onSubmit: (result: string) => void

    constructor(app: App, pluginSettings: ColorPaletteSettings, onSubmit: (result: string) => void) {
        super(app);
        this.onSubmit = onSubmit;
        this.url = '';
        this.settings = { height: pluginSettings.height, width: pluginSettings.width, direction: pluginSettings.direction, gradient: pluginSettings.gradient, hover: pluginSettings.hover, override: pluginSettings.override, aliases: [] };
        this.colors = []
        this.colorContainers = [];
        this.combination = Combination.Random;
    }

    onOpen(): void {
        const { contentEl } = this;
        
        contentEl.createEl('h1', { text: 'Create Palette' })
        contentEl.addClass('create-palette');

        const colorsContainer = contentEl.createEl('section');
        // Create header for colors section
        colorsContainer.createEl('h3').setText('Colors');

        new Setting(colorsContainer)
        .setName("URL")
        .setDesc('Only coolors.co & colorhunt.co are currently supported.')
        .addText((text) => {
            text
            .onChange((value) => {
                this.url = value;
            })
        })

        let colorPicker = new Setting(colorsContainer)
        .setName("Color Picker")
        .setDesc('Use handpicked colors')
        .addColorPicker((color) => {
            color.onChange((value) => {
                this.colors.push(value);
                this.settings.aliases.push('');
                selectedColorsContainer.style.setProperty('--selected-colors-display', this.colors.length === 0 ? 'none' : 'flex');
                let colorContainer = selectedColorsContainer.createEl('div');
                let colorSpan = colorContainer.createEl('span');
                // Focus color & allow for editing alias
                colorSpan.addEventListener('click', (e) => {
                    colorSpan.contentEditable = 'true';
                    colorSpan.toggleClass('color-span-editable', true);
                })
                // Set alias if changed & de-focus
                colorSpan.addEventListener('focusout', (e) => {
                    colorSpan.contentEditable = 'false';
                    colorSpan.toggleClass('color-span-editable', false);
                    // Set alias color if user modified text
                    if(colorSpan.getText() !== value){
                        this.settings.aliases[this.colors.findIndex(val => val === value)] = colorSpan.getText();
                    }
                })
                colorSpan.style.borderColor = value;
                colorSpan.setText(value);
                let trash = colorContainer.createEl('button');
                setIcon(trash, 'trash-2');
                trash.style.setProperty('--trash-background-color', value);
                const csColor = colorsea(value);
                trash.style.setProperty('--trash-color', (csColor.rgb()[0]*0.299 + csColor.rgb()[1]*0.587 + csColor.rgb()[2]*0.114) > 186 ? '#000000' : '#ffffff');
                trash.addEventListener('click', (e) => {
                    const iContainers = this.colorContainers.indexOf(colorContainer);
                    this.colorContainers.splice(iContainers, 1);
                    const iColors = this.colors.indexOf(value);
                    this.colors.splice(iColors, 1);
                    selectedColorsContainer.removeChild(colorContainer);
                    selectedColorsContainer.style.setProperty('--selected-colors-display', this.colors.length === 0 ? 'none' : 'flex');
                })
                this.colorContainers.push(colorContainer);
            })
        })
        colorPicker.controlEl.addClass('color-picker');

        let selectedColorsContainer = colorPicker.controlEl.createEl('div');

        new Setting(colorsContainer)
        .setName("Generate Random")
        .setDesc('Generate random colors based on color theory')
        .addDropdown((dropdown) => {
            Object.keys(Combination).forEach((combination) => {
                dropdown.addOption(combination, combination);
            })
            dropdown
            .setValue(this.combination)
            .onChange((value) => {
                const combination = value as Combination;
                this.combination = combination;
                this.colors = generateRandomColors(combination).colors;
            })
        })

        const settingsContainer = contentEl.createEl('section');
        // Create header for settings section
        settingsContainer.createEl('h3').setText('Settings');

        new Setting(settingsContainer)
            .setName("Height")
            .addText((text) => {
                text
                .setValue(this.settings.height.toString())
                .onChange((value) => {
                    this.settings.height = Number(value);
                })
            })

        new Setting(settingsContainer)
            .setName("Width")
            .setDesc('Caution - Might cause palette to display incorrectly.')
            .addText((text) => {
                text
                .setValue(this.settings.width.toString())
                .onChange((value) => {
                    this.settings.width = Number(value);
                })
            })

        new Setting(settingsContainer)
            .setName("Direction")
            .addDropdown((dropdown) => {
                dropdown
                .addOption(Direction.Column, Direction.Column)
                .addOption(Direction.Row, Direction.Row)
                .setValue(this.settings.direction.toString())
                .onChange((value) => {
                    this.settings.direction = value as Direction;
                })
            })

        new Setting(settingsContainer)
            .setName("Gradient")
            .addToggle((toggle) => {
                toggle
                .setValue(this.settings.gradient)
                .onChange((value) => {
                    this.settings.gradient = value;
                })
            })

        new Setting(settingsContainer)
            .setName("Hover")
            .setDesc("Toggles whether palettes can be hovered")
            .addToggle((toggle) => {
                toggle
                .setValue(this.settings.hover)
                .onChange(async (value) => {
                    this.settings.hover = value;
                })
            })

        new Setting(settingsContainer)
            .setName("Override")
            .setDesc("Disables color validation for full control (advanced)")
            .addToggle((toggle) => {
                toggle
                .setValue(this.settings.override)
                .onChange(async (value) => {
                    this.settings.override = value;
                })
            })

        new Setting(settingsContainer)
        .addButton((button) => 
            button
            .setButtonText("Create")
            .setCta()
            .onClick(() => {
                try{
                    if(!this.url.match(urlRegex) && this.url !== '') throw new Error('URL provided is not valid.');
                    // Generate random colors if none are provided
                    if(this.colors.length === 0) this.colors = generateRandomColors(Combination.Random).colors;
                    this.result = `${this.url.match(urlRegex) ? 
                    this.url 
                    : 
                    this.colors.toString()}\n{"height": ${this.settings.height}, "direction": "${this.settings.direction}", "gradient": ${this.settings.gradient}, "hover": ${this.settings.hover}, "override": ${this.settings.override}, "aliases": ${JSON.stringify(this.settings.aliases)}}`
                    this.close();
                    this.onSubmit(this.result);
                }
                catch(e){
                    new Notice(e);
                }
            })
        )
    }

    onClose(): void {
        let { contentEl } = this;
        contentEl.empty();
    }
}