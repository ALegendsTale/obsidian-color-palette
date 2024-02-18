import ColorPalette from "./main";
import { App, PluginSettingTab, Setting } from "obsidian";

export type AliasModeType = 
	| 'Both'
	| 'Prefer Alias'

export interface ColorPaletteSettings {
	noticeDuration: number;
	errorPulse: boolean;
	aliasMode: AliasModeType;
}

export const DefaultSettings: ColorPaletteSettings = {
	noticeDuration: 10000,
	errorPulse: true,
	aliasMode: 'Both'
};

export class SettingsTab extends PluginSettingTab {
	plugin: ColorPalette;

	constructor(app: App, plugin: ColorPalette) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display() {
		const { containerEl } = this;
		let { settings } = this.plugin;

		containerEl.empty();

		new Setting(containerEl)
			.setName("Notice Duration")
			.setDesc("How long error messages are show for in seconds (0 for indefinite)")
			.addText((text) => {
				text
				.setValue((settings.noticeDuration / 1000).toString())
				.onChange(async (value) => {
					settings.noticeDuration = Number(value) * 1000;
					await this.plugin.saveSettings();
				});
			});
		
		new Setting(containerEl)
			.setName("Palette Error Pulse")
			.setDesc("Whether the affected palette should pulse when encountering an error")
			.addToggle((toggle) => {
				toggle
				.setValue(settings.errorPulse)
				.onChange(async (value) => {
					settings.errorPulse = value;
					await this.plugin.saveSettings();
				})
			})

		new Setting(containerEl)
			.setName('Alias Mode')
			.setDesc('What will be shown when aliases option is set in local palette options. Defaults to showing both hex and alias.')
			.addDropdown((dropdown) => {
				dropdown
				.addOption('Both', 'Both')
				.addOption('Prefer Alias', 'Prefer Alias')
				.setValue(this.plugin.settings.aliasMode.toString())
				.onChange(async (value) => {
					settings.aliasMode = value as AliasModeType;
					await this.plugin.saveSettings();
				})
			})
	}

	hide() {
		if (this.plugin?.palettes) {
			for (let palette of this.plugin.palettes) {
				palette.refresh();
			}
		}
	}
}
