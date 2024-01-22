import { App, Modal, Notice, Setting, setIcon } from "obsidian";
import { PaletteSettings, direction } from "./palette";
import { urlRegex } from "./main";
import colorsea from "colorsea";

export class CommandInput extends Modal {
    result: string;
    url: string;
    paletteSettings: PaletteSettings
    colors: string[]
    colorContainers: HTMLDivElement[]
    onSubmit: (result: string) => void

    constructor(app: App, onSubmit: (result: string) => void) {
        super(app);
        this.onSubmit = onSubmit;
        this.url = '';
        this.paletteSettings = {gradient: false, direction: 'column', height: 150, width: 700};
        this.colors = [];
        this.colorContainers = [];
    }

    onOpen(): void {
        const { contentEl } = this;
        
        contentEl.createEl('h1', { text: 'Create Palette' })
        contentEl.addClass('create-palette');

        new Setting(contentEl)
        .setName("URL")
        .addText((text) => {
            text
            .onChange((value) => {
                this.url = value;
            })
        })

        let orContainer = contentEl.createEl('div')
        orContainer.addClass('or-container');
        let orSpan = orContainer.createEl('span');
        orSpan.setText('OR');

        let colorPicker = new Setting(contentEl)
        .setName("Color Picker")
        .addColorPicker((color) => {
            color.onChange((value) => {
                this.colors.push(value);
                colorsContainer.style.setProperty('--selected-colors-display', this.colors.length === 0 ? 'none' : 'flex');
                let colorContainer = colorsContainer.createEl('div');
                let colorSpan = colorContainer.createEl('span');
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
                    colorsContainer.removeChild(colorContainer);
                    colorsContainer.style.setProperty('--selected-colors-display', this.colors.length === 0 ? 'none' : 'flex');
                })
                this.colorContainers.push(colorContainer);
            })
        })
        colorPicker.settingEl.addClass('color-picker-container');
        colorPicker.controlEl.addClass('color-picker');

        // Selected Colors Container
        let colorsContainer = colorPicker.controlEl.createEl('div');

        new Setting(contentEl)
        .setName("Gradient")
        .addToggle((toggle) => {
            toggle
            .setValue(this.paletteSettings.gradient)
            .onChange((value) => {
                this.paletteSettings.gradient = value;
            })
        })

        new Setting(contentEl)
        .setName("Direction")
        .addDropdown((dropdown) => {
            dropdown
            .addOption('column', 'column')
            .addOption('row', 'row')
            .setValue(this.paletteSettings.direction.toString())
            .onChange((value) => {
                this.paletteSettings.direction = value as direction;
            })
        })

        new Setting(contentEl)
        .setName("Height")
        .addText((text) => {
            text
            .setValue(this.paletteSettings.height.toString())
            .onChange((value) => {
                this.paletteSettings.height = Number(value);
            })
        })

        new Setting(contentEl)
        .addButton((button) => 
            button
            .setButtonText("Create")
            .setCta()
            .onClick(() => {
                try{
                    this.result = `${this.url.match(urlRegex) ? this.url : this.colors.toString()}\n{"gradient": ${this.paletteSettings.gradient}, "direction": "${this.paletteSettings.direction}", "height": ${this.paletteSettings.height}}`
                    if(this.url === '' && this.colors.length === 0) throw new Error('URL or colors were not provided.');
                    if(!this.url.match(urlRegex) && this.colors.length === 0) throw new Error('URL provided is not valid.');
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