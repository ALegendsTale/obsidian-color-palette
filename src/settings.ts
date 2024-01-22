import ColorPalette from "./main";
import { App, PluginSettingTab, Setting } from "obsidian";

export interface ColorPaletteSettings {
	noticeDuration: number;
}

export const DefaultSettings: ColorPaletteSettings = {
	noticeDuration: 10000,
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
	}

	hide() {
		if (this.plugin?.palettes) {
			for (let palette of this.plugin.palettes) {
				palette.refresh();
			}
		}
	}
}
