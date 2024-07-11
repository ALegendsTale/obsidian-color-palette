import ColorPalette from "main";
import { App, Notice, PluginSettingTab, Setting } from "obsidian";
import { PaletteSettings } from "components/Palette";
import { pluginToPaletteSettings } from "utils/basicUtils";

export enum Direction {
    Row = 'row',
    Column = 'column'
}

export enum AliasMode {
	Both = 'Both',
	Alias = 'Prefer Alias'
}

export interface ColorPaletteSettings {
	noticeDuration: number;
	errorPulse: boolean;
	aliasMode: AliasMode;
	corners: boolean;
	hoverWhileEditing: boolean;
	height: number;
	width: number;
	direction: Direction,
	gradient: boolean,
	hover: boolean,
	override: boolean
}

export const defaultSettings: ColorPaletteSettings = {
	noticeDuration: 10000,
	errorPulse: true,
	aliasMode: AliasMode.Both,
	corners: true,
	hoverWhileEditing: false,
	height: 150,
	width: 700,
	direction: Direction.Column,
	gradient: false,
	hover: true,
	override: false
};

export class SettingsTab extends PluginSettingTab {
	plugin: ColorPalette;
	settings: PaletteSettings

	constructor(app: App, plugin: ColorPalette) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display() {
		const { containerEl } = this;
		let { settings } = this.plugin;
		this.settings = pluginToPaletteSettings(settings);

		containerEl.empty();

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
			.setName("Notice Duration")
			.setDesc("How long palette error messages are show for in seconds (0 for indefinite)")
			.addText((text) => {
				text
				.setValue((settings.noticeDuration / 1000).toString())
				.onChange(async (value) => {
					try {
                        // Check if valid number
                        if(!Number.isNaN(Number(value))) {
							settings.noticeDuration = Number(value) * 1000;
							await this.plugin.saveSettings();
                        }
                        else throw new Error('Please enter a number.');
                    }
                    catch(e) {
                        new Notice(e);
                    }
				});
			});

		new Setting(containerEl)
			.setName('Alias Mode')
			.setDesc('What will be shown when aliases option is set in local palette options. Defaults to showing both hex and alias.')
			.addDropdown((dropdown) => {
				dropdown
				.addOption(AliasMode.Both, AliasMode.Both)
				.addOption(AliasMode.Alias, AliasMode.Alias)
				.setValue(this.plugin.settings.aliasMode)
				.onChange(async (value) => {
					settings.aliasMode = value as AliasMode;
					await this.plugin.saveSettings();
				})
			})

		new Setting(containerEl)
			.setName("Palette Corners")
			.setDesc("Minor aesthetic change which toggles whether the corners on palettes are rounded.")
			.addToggle((toggle) => {
				toggle
				.setValue(settings.corners)
				.onChange(async (value) => {
					settings.corners = value;
					await this.plugin.saveSettings();
				})
			})

		new Setting(containerEl)
			.setName("Hover while editing")
			.setDesc("Whether hover mode is active while editing.")
			.addToggle((toggle) => {
				toggle
				.setValue(settings.hoverWhileEditing)
				.onChange(async (value) => {
					settings.hoverWhileEditing = value;
					await this.plugin.saveSettings();
				})
			})

		containerEl.createEl('h2').setText('Palette Defaults');
		
		new Setting(containerEl)
			.setName('Height')
			.addText((text) => {
				text
				.setValue(settings.height.toString())
				.onChange(async (value) => {
					try {
                        // Check if valid number
                        if(!Number.isNaN(Number(value))) {
							settings.height = Number(value);
							await this.plugin.saveSettings();
                        }
                        else throw new Error('Please enter a number.');
                    }
                    catch(e) {
                        new Notice(e);
                    }
				})
			})

		new Setting(containerEl)
			.setName('Width')
			.setDesc('Caution - Might cause palettes to display incorrectly.')
			.addText((text) => {
				text
				.setValue(settings.width.toString())
				.onChange(async (value) => {
					try {
                        // Check if valid number
                        if(!Number.isNaN(Number(value))) {
							settings.width = Number(value);
							await this.plugin.saveSettings();
                        }
                        else throw new Error('Please enter a number.');
                    }
                    catch(e) {
                        new Notice(e);
                    }
				})
			})

		new Setting(containerEl)
			.setName('Direction')
			.addDropdown((dropdown) => {
				dropdown
				.addOption(Direction.Column, Direction.Column)
				.addOption(Direction.Row, Direction.Row)
				.setValue(this.plugin.settings.direction)
				.onChange(async (value) => {
					settings.direction = value as Direction
					await this.plugin.saveSettings();
				})
			})

		new Setting(containerEl)
			.setName('Gradient')
			.addToggle((toggle) => {
				toggle
				.setValue(this.plugin.settings.gradient)
				.onChange(async (value) => {
					settings.gradient = value;
					await this.plugin.saveSettings();
				})
			})

		new Setting(containerEl)
			.setName("Hover")
			.setDesc("Toggles whether palettes can be hovered")
			.addToggle((toggle) => {
				toggle
				.setValue(settings.hover)
				.onChange(async (value) => {
					settings.hover = value;
					await this.plugin.saveSettings();
				})
			})

		new Setting(containerEl)
			.setName("Override")
			.setDesc("Disables color validation for full control (advanced)")
			.addToggle((toggle) => {
				toggle
				.setValue(settings.override)
				.onChange(async (value) => {
					settings.override = value;
					await this.plugin.saveSettings();
				})
			})
	}

	// Called when settings are exited
	hide() {
		const settingsChanged = JSON.stringify(this.settings) !== JSON.stringify(pluginToPaletteSettings(this.plugin.settings));
		// Update palettes if PaletteSettings have changed
		if (this.plugin?.palettes && settingsChanged) {
			for (let paletteMRC of this.plugin.palettes) {
				paletteMRC.update();
			}
		}
	}
}
