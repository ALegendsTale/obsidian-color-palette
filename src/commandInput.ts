import { App, Modal, Notice, Setting, setIcon } from "obsidian";
import { PaletteSettings, direction } from "./palette";
import { urlRegex } from "./main";

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

        new Setting(contentEl)
        .setName("URL")
        .addText((text) => {
            text
            .onChange((value) => {
                this.url = value;
            })
        })

        let urlOrPickerContainer = contentEl.createEl('div')
        urlOrPickerContainer.addClass('create-url');
        let uopSpan = urlOrPickerContainer.createEl('span');
        uopSpan.setText('OR');
        uopSpan.style.setProperty('font-weight', 'bold');

        let colorPicker = new Setting(contentEl)
        .setName("Color Picker")
        .addColorPicker((color) => {
            color.onChange((value) => {
                this.colors.push(value);
                let colorContainer = colorsContainer.createEl('div');
                let colorSpan = colorContainer.createEl('span');
                colorSpan.setText(value);
                let trash = colorContainer.createEl('button');
                setIcon(trash, 'trash-2');
                trash.style.setProperty('background-color', value);
                trash.addEventListener('click', (e) => {
                    const iContainers = this.colorContainers.indexOf(colorContainer);
                    this.colorContainers.splice(iContainers, 1);
                    const iColors = this.colors.indexOf(value);
                    this.colors.splice(iColors, 1);
                    colorsContainer.removeChild(colorContainer);
                })
                this.colorContainers.push(colorContainer);
            })
        })
        colorPicker.controlEl.addClass('create-color-picker');
        colorPicker.settingEl.style.setProperty('border-top', 'none');

        let colorsContainer = colorPicker.controlEl.createEl('div');
        colorsContainer.addClass('create-colors');
        let colorsText = colorsContainer.createEl('span');
        colorsText.setText('Colors:');

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
            .setButtonText("create")
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