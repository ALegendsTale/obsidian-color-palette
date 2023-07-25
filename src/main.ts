import { Editor, MarkdownPostProcessorContext, Notice, Plugin } from 'obsidian'
import { CommandInput } from 'src/commandInput';
import { Palette } from 'src/palette';
import { ColorPaletteSettings, DefaultSettings, SettingsTab } from 'src/settings';

export const urlRegex = /\/([^\/]+)\/?$/

export default class ColorPalette extends Plugin {
	settings: ColorPaletteSettings;
	palettes?: Palette[];

	async onload() {
		this.palettes = [];
		await this.loadSettings();

		this.registerMarkdownCodeBlockProcessor(
			'palette',
			async (source: string, el: HTMLElement, ctx: MarkdownPostProcessorContext) => {
				ctx.addChild(new Palette(this, this.settings, el, source.trim()));
			}
		)

		this.addCommand({
			id: "insert-link",
			name: 'Insert Link',
			editorCallback: (editor: Editor) => {
				new CommandInput(this.app, (result) => {
					if(!result?.match(urlRegex)) return;
					const codeBlock = `\`\`\`palette\n${result}\n\`\`\`\n`;
					const cursor = editor.getCursor();
					editor.transaction({
						changes: [{ from: cursor, text: codeBlock }]
					})
					editor.setCursor({
						line: cursor.line + codeBlock.split('\n').length,
						ch: 0
					})
					new Notice(`Added ${result}`);
				})
				.open();
			}
		})

		this.addCommand({
			id: "convert-link",
			name: 'Convert Link',
			editorCallback: (editor: Editor) => {
				const link = editor.getSelection();
				if(!link.match(urlRegex)) return;
				const codeBlock = `\`\`\`palette\n${link}\n\`\`\`\n`;
				const cursor = editor.getCursor();
				editor.replaceSelection(codeBlock);
				editor.setCursor({
					line: cursor.line + codeBlock.split('\n').length,
					ch: 0
				})
				new Notice(`Converted ${editor.getSelection()}`)
			}
		})

		this.addSettingTab(new SettingsTab(this.app, this));
	}
	
	async loadSettings() {
		this.settings = Object.assign({}, DefaultSettings, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}