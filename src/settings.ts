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

export enum CopyFormat {
	Raw = 'Raw',
	Value = 'Value'
}

export interface ColorPaletteSettings {
	noticeDuration: number;
	errorPulse: boolean;
	aliasMode: AliasMode;
	corners: boolean;
	stabilityWhileEditing: boolean;
	reloadDelay: number;
	copyFormat: CopyFormat;
	height: number;
	width: number;
	direction: Direction,
	gradient: boolean,
	hover: boolean,
	hideText: boolean,
	override: boolean
}

export const defaultSettings: ColorPaletteSettings = {
	noticeDuration: 10000,
	errorPulse: true,
	aliasMode: AliasMode.Both,
	corners: true,
	stabilityWhileEditing: true,
	reloadDelay: 5,
	copyFormat: CopyFormat.Raw,
	height: 150,
	width: 700,
	direction: Direction.Column,
	gradient: false,
	hover: true,
	hideText: false,
	override: false
};

export class SettingsTab extends PluginSettingTab {
	plugin: ColorPalette;
	settings: PaletteSettings;
	reloadDelay: number;

	constructor(app: App, plugin: ColorPalette) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display() {
		const { containerEl } = this;
		let { settings } = this.plugin;
		this.settings = pluginToPaletteSettings(settings);
		this.reloadDelay = settings.reloadDelay;

		containerEl.empty();

		containerEl.createEl('h2').setText('General');
		containerEl.addClass('color-palette-settings');

		new Setting(containerEl)
			.setName('Alias Mode')
			.setDesc('What will be shown when aliases option is set in local palette options. Defaults to showing both color and alias.')
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
			.setName("Stability While Editing")
			.setDesc("Keeps the palette from moving while in edit mode.")
			.addToggle((toggle) => {
				toggle
				.setValue(settings.stabilityWhileEditing)
				.onChange(async (value) => {
					settings.stabilityWhileEditing = value;
					await this.plugin.saveSettings();
				})
			})

		new Setting(containerEl)
			.setName("Reload Delay")
			.setDesc("How long it takes in milliseconds for palettes to be updated after changes have been made (Larger values are less responsive).")
			.addText((text) => {
				text
				.setValue(settings.reloadDelay.toString())
				.onChange(async (value) => {
					try {
						// Check if valid number
						if(!Number.isNaN(Number(value))) {
							settings.reloadDelay = Number(value);
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
			.setName('Copy Format')
			.setDesc('Choice of format when copying colors.')
			.addDropdown((dropdown) => {
				dropdown
				.addOption(CopyFormat.Raw, CopyFormat.Raw)
				.addOption(CopyFormat.Value, CopyFormat.Value)
				.setValue(this.plugin.settings.copyFormat)
				.onChange(async (value) => {
					settings.copyFormat = value as CopyFormat;
					await this.plugin.saveSettings();
				})
			})

		containerEl.createEl('h2').setText('Defaults');
		
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
			.setName("Hide Text")
			.setDesc("Disables color and alias visibility")
			.addToggle((toggle) => {
				toggle
				.setValue(settings.hideText)
				.onChange(async (value) => {
					settings.hideText = value;
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

		containerEl.createEl('h2').setText('Other');

		new Setting(containerEl)
			.setName("Palette Error Pulse")
			.setDesc("Whether the affected palette should pulse when encountering an error.")
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
			.setDesc("How long palette error messages are show for in seconds (0 for indefinite).")
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
			.setName('Donate')
			.setDesc('If you like this plugin, consider donating to support continued development.')
			.addButton((button) => {
				button
				.onClick(() => open('https://github.com/sponsors/ALegendsTale'))
				.setClass('color-palette-donate')
				
				const image = button.buttonEl.appendChild(createEl('img'));
				image.src = 'https://img.shields.io/badge/Sponsor-%E2%9D%A4-%23EA4AAA?style=flat&logo=Github';
			})
			.addButton((button) => {
				button
				.onClick(() => open('https://www.paypal.com/donate/?hosted_button_id=BHHFMGX822K4S'))
				.setClass('color-palette-donate')
				
				const image = button.buttonEl.appendChild(createEl('img'));
				image.src = 'https://img.shields.io/badge/Paypal-%23003087?style=flat&logo=Paypal';
			})
	}

	// Called when settings are exited
	hide() {
		const settingsChanged = JSON.stringify(this.settings) !== JSON.stringify(pluginToPaletteSettings(this.plugin.settings));
		const reloadDelayChanged = this.reloadDelay !== this.plugin.settings.reloadDelay;
		// Update palettes if PaletteSettings have changed
		if (this.plugin?.palettes && (settingsChanged || reloadDelayChanged)) {
			for (let paletteMRC of this.plugin.palettes) {
				paletteMRC.update();
			}
		}
	}
}
