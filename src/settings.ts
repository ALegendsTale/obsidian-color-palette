import ColorPalette from "./main";
import { App, PluginSettingTab, Setting } from "obsidian";

type direction = 
    | 'row' 
    | 'column'

export interface ColorPaletteSettings {
    paletteHeight: number;
    paletteDirection: direction
}

export const DefaultSettings: ColorPaletteSettings = {
    paletteHeight: 150,
    paletteDirection: 'row',
}

export class SettingsTab extends PluginSettingTab {
    plugin: ColorPalette;

    constructor(app: App, plugin: ColorPalette){
        super(app, plugin);
        this.plugin = plugin;
    }

    display() {
        const { containerEl } = this;
        let { settings } = this.plugin;
        
        containerEl.empty();
        
        new Setting(containerEl)
            .setName('Palette Height')
            .setDesc('How tall the palette should be')
            .addText((text) => {
                text
                    .setValue(settings.paletteHeight.toString())
                    .onChange(async (value) => {
                        settings.paletteHeight = Number(value);
                        await this.plugin.saveSettings();
                    })
                })

        new Setting(containerEl)
            .setName('Palette Direction')
            .setDesc('Which direction the colors should face')
            .addDropdown((dropdown) => {
                dropdown
                    // Inverted to match user expectations
                    .addOptions({'row': 'column', 'column': 'row'})
                    .setValue(settings.paletteDirection)
                    .onChange(async (value) => {
                        settings.paletteDirection = value as direction;
                        await this.plugin.saveSettings();
                    })
            })
    }

    hide() {
        if(this.plugin?.palettes){
            for(let palette of this.plugin.palettes){
                palette.refresh();
            }
        }
    }
}