import { Editor, MarkdownPostProcessorContext, Notice, Plugin } from 'obsidian'
import { CreatePaletteModal } from 'src/CreatePaletteModal';
import { GeneratePaletteModal } from './GeneratePaletteModal';
import { Palette } from 'src/palette';
import { ColorPaletteSettings, defaultSettings, SettingsTab } from 'src/settings';

export const urlRegex = /(?:https:\/\/www\.|http:\/\/www\.|https:\/\/|http:\/\/)?[a-zA-Z0-9]{2,}(?:\.[a-zA-Z0-9]{2,})(?:\.[a-zA-Z0-9]{2,})?\/(?:palette\/)?([a-zA-Z0-9-]{2,})/

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
			id: 'create',
			name: 'Create',
			editorCallback: (editor: Editor) => {
				new CreatePaletteModal(this.app, this.settings, (result) => {
					try {
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
			name: 'Convert link',
			editorCallback: (editor: Editor) => {
				try {
					const link = editor.getSelection();
					if(!link.match(`^${urlRegex.source}$`)) throw new Error('Selected text is not a link.');
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
					const multiReg = RegExp(/(?:\`{3}palette)\n(?<url>.*)(?:\n(?<settings>.+))?\n\`{3}/, 'g');
					const content = [...codeBlock.matchAll(multiReg)]?.[0]?.slice(1);
					const url = content?.[0];
					if(url == null) throw new Error('Selected text is not a codeblock with a link.');
					let colors: string[] = [];
					// Check if link & contains dashes (coolor url)
					url.match(urlRegex) && url.includes('-') ? 
					colors = url.substring(url.lastIndexOf('/') + 1).split('-').map(i => '#' + i)
					:
					// Check if link (colorhunt)
					url.match(urlRegex) ?
					colors = url.substring(url.lastIndexOf('/') + 1).match(/.{1,6}/g)?.map(i => '#' + i) || ['Invalid Palette']
					: 
					colors = ['Invalid Palette']
	
					if(colors[0] === 'Invalid Palette') throw new Error('Selected codeblock can not be converted to hex.');
	
					const newBlock = `\`\`\`palette\n${colors.toString()}${content?.[1] ? '\n' + content[1] : ''}\n\`\`\``;
					editor.replaceSelection(newBlock)
					new Notice(`Converted codeblock link to hex`)
				} 
				catch (error) {
					new Notice(error);
				}
			}
		})

		this.addCommand({
			id: 'generate-random-palette',
			name: 'Generate random palette',
			editorCallback: (editor: Editor) => {
				new GeneratePaletteModal(this.app, editor, this.settings).open();
			}
		})

		this.addSettingTab(new SettingsTab(this.app, this));
	}
	
	async loadSettings() {
		this.settings = Object.assign({}, defaultSettings, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}