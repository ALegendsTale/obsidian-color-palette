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
			id: 'insert-link',
			name: 'Insert Link',
			editorCallback: (editor: Editor) => {
				new CommandInput(this.app, (result) => {
					try {
						if(!result?.match(urlRegex)) throw new Error('Entered text is not a link.');
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
					} 
					catch (error) {
						new Notice(error);
					}
				})
				.open();
			}
		})

		this.addCommand({
			id: 'convert-link',
			name: 'Convert Link',
			editorCallback: (editor: Editor) => {
				try {
					const link = editor.getSelection();
					if(!link.match(urlRegex)) throw new Error('Selected text is not a link.');
					const codeBlock = `\`\`\`palette\n${link}\n\`\`\`\n`;
					const cursor = editor.getCursor();
					editor.replaceSelection(codeBlock);
					editor.setCursor({
						line: cursor.line + codeBlock.split('\n').length,
						ch: 0
					})
					new Notice(`Converted ${editor.getSelection()}`)
				} 
				catch (error) {
					new Notice(error);
				}
			}
		})

		this.addCommand({
			id: 'convert-codeblock-link-to-hex',
			name: 'Convert codeblock link to hex',
			editorCallback: (editor: Editor) => {
				try {
					const codeBlock = editor.getSelection();
					const split = codeBlock.split('\n')
					const link = split[1];
					let colors: string[] = [];
					// Check if link & contains dashes (coolor url)
					link.match(urlRegex) && link.contains('-') ? 
					colors = link.substring(link.lastIndexOf('/') + 1).split('-').map(i => '#' + i)
					:
					// Check if link (colorhunt)
					link.match(urlRegex) ?
					colors = link.substring(link.lastIndexOf('/') + 1).match(/.{1,6}/g)?.map(i => '#' + i) || ['Invalid Palette']
					: 
					colors = ['Invalid Palette']
	
					if(colors[0] === 'Invalid Palette') throw new Error('Selected codeblock could not be converted to hex.');
	
					const newBlock = `\`\`\`palette\n${colors.toString()}\n\`\`\``;
					editor.replaceSelection(newBlock)
					new Notice(`Converted codeblock link to hex`)
				} 
				catch (error) {
					new Notice(error);
				}
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