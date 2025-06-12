import { MarkdownPostProcessorContext, MarkdownRenderChild, MarkdownView, Notice } from "obsidian";
import ColorPalettePlugin from "main";
import { ColorPalette } from "@alegendstale/holly-components/color-palette";
import { calcColorsAndSettings, ColorPaletteSettings, defaultSettings, PaletteSettings, Status } from "@alegendstale/holly-components/color-palette/utils";
import { createPaletteBlock, getModifiedSettings, pluginToPaletteSettings } from "@alegendstale/holly-components/utils";
import { PaletteMenu } from "./PaletteMenu";
import { renderPalette } from "utils/litRender";

export class PaletteMRC extends MarkdownRenderChild {
	plugin: ColorPalettePlugin;
	pluginSettings: ColorPaletteSettings;
	input: string;
	palette: ColorPalette | null;
	context: MarkdownPostProcessorContext;
	editModeChanges: { colors: string[], settings: Partial<PaletteSettings> | undefined };

	constructor(plugin: ColorPalettePlugin, containerEl: HTMLElement, input: string, context: MarkdownPostProcessorContext) {
		super(containerEl);
		this.plugin = plugin;
		this.pluginSettings = plugin.settings;
		this.input = input;
		this.context = context;
	}

	onload(): void {
		this.update();
		// Add new palette to state
		this.plugin.palettes?.push(this);

		this.containerEl.addEventListener('contextmenu', (e) => {
				// Ensure palette is valid before creating a new menu
				if(this.palette?.status === Status.VALID) {
					const paletteMenu = new PaletteMenu(this.plugin.app, this.context, this.palette, (colors, settings) => {
						if(colors == undefined) this.setPaletteInput('');
						else this.setPaletteInput(createPaletteBlock({ colors, settings }));
					});
					paletteMenu.showAtMouseEvent(e);
				}
		})
	}

	unload(): void {
		// Remove palette from state
		this.plugin.palettes?.remove(this);
	}

	/**
	 * Updates the palette contents
	 */
	public update() {
		// Remove current palette
		this.containerEl.empty();

		// Calculate colors & settings
		const { colors, settings } = calcColorsAndSettings(this.input, this.pluginSettings);

		// Set editModeChanges initial values if valid
		if(typeof colors !== 'string' && typeof settings !== 'string') this.editModeChanges = {colors, settings};

		const paletteSettings = settings instanceof Object ? settings : pluginToPaletteSettings(defaultSettings);
		// Create new palette
		this.palette = renderPalette(
			this.containerEl,
			colors instanceof Array ? colors : [],
			{
				...paletteSettings,
			}
		);

		this.palette?.emitter.on('changed', (colors, settings) => {
			const modifiedSettings = getModifiedSettings(settings);
			// Save stored changes
			this.editModeChanges = { colors, settings: modifiedSettings };
		})
		this.palette?.emitter.on('editMode', (editMode) => {
			if(!editMode) {
				// Set palette input to stored changes
				this.setPaletteInput(createPaletteBlock({ colors: this.editModeChanges.colors, settings: this.editModeChanges.settings }));
			}
		})
	}

	/**
	 * Gets the palette codeblock input
	 */
	public getPaletteInput() {
		if(!this.palette) return;

		let editor = this.plugin.app.workspace.getActiveViewOfType(MarkdownView)?.editor;
		// Palette line start & line end
		const paletteSection = this.context.getSectionInfo(this.palette);
		if(paletteSection && editor) return {
			lines: {
				lineStart: paletteSection.lineStart, 
				lineEnd: paletteSection.lineEnd
			}, 
			input: editor.getRange(
				{line: paletteSection.lineStart, ch: 0}, 
				{line: paletteSection.lineEnd + 1, ch: 0}
			)
		}
		else {
			this.createNotice('The editor has not fully loaded yet.');
		}
	}

	/**
	 * Sets the palette codeblock input with `replacement`
	 */
	public setPaletteInput(replacement: string) {
		if(!this.palette) return;

		let editor = this.plugin.app.workspace.getActiveViewOfType(MarkdownView)?.editor;
		// Palette line start & line end
		const paletteSection = this.context.getSectionInfo(this.palette);
		if(paletteSection && editor) {
			editor.replaceRange(replacement, {line: paletteSection.lineStart, ch: 0}, {line: paletteSection.lineEnd + 1, ch: 0});
			return {
				lineStart: paletteSection.lineStart, 
				lineEnd: paletteSection.lineEnd
			};
		}
		else {
			this.createNotice('The editor has not fully loaded yet.');
		}
	}

	/**
	 * Creates a new notice using pre-set settings
	 * @param message Message to display
	 */
	public createNotice(message: string) {
		new Notice(message, this.pluginSettings.noticeDuration);
	}
}