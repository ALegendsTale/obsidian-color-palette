import { Editor, MarkdownPostProcessorContext, Notice, Plugin } from 'obsidian'
import { EditorModal } from 'components/EditorModal';
import { GenerateModal } from 'components/GenerateModal';
import { ColorPaletteSettings, defaultSettings, SettingsTab } from 'settings';
import { PaletteMRC } from 'components/PaletteMRC';
import { createPaletteBlock } from 'utils/basicUtils';

export const urlRegex = /(?:https:\/\/www\.|http:\/\/www\.|https:\/\/|http:\/\/)?[a-zA-Z0-9]{2,}(?:\.[a-zA-Z0-9]{2,})(?:\.[a-zA-Z0-9]{2,})?\/(?:palette\/)?([a-zA-Z0-9-]{2,})/

export default class ColorPalette extends Plugin {
	settings: ColorPaletteSettings;
	palettes?: PaletteMRC[];

	async onload() {
		this.palettes = [];
		await this.loadSettings();

		/**
		 * Changes when text length is extended or shortened.
		 * DOES NOT change when text length remains the same.
		 * This means simply swapping characters, but having the same length won't update this function.
		 */
		this.registerMarkdownCodeBlockProcessor(
			'palette',
			async (source: string, el: HTMLElement, ctx: MarkdownPostProcessorContext) => {
				ctx.addChild(new PaletteMRC(this, el, source.trim(), ctx));
			}
		)

		this.addCommand({
			id: 'create',
			name: 'Create',
			editorCallback: (editor: Editor) => {
				new EditorModal(this.app, this.settings, (colors, settings) => {
					try {
						const result = createPaletteBlock({colors, settings});
						const cursor = editor.getCursor();
						editor.transaction({
							changes: [{ from: cursor, text: result }]
						})
						editor.setCursor({
							line: cursor.line + result.split('\n').length,
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
			editorCallback: async (editor: Editor) => {
				try {
					let link = '';
					const editorSelection = editor.getSelection();
					const clipboardText = await navigator.clipboard.readText();

					// Check if selection text matches regex
					if(editorSelection.match(`^${urlRegex.source}$`)) link = editorSelection;
					// Check if clipboard text matches regex
					else if(clipboardText.match(`^${urlRegex.source}$`)) link = clipboardText;
					// Throw error if selection & clipboard don't match URL regex
					else throw new Error('Failed to convert link. Please select or copy a link, then try again.');

					const codeBlock = createPaletteBlock(link);
					const cursor = editor.getCursor();
					editor.replaceSelection(codeBlock);
					editor.setCursor({
						line: cursor.line + codeBlock.split('\n').length,
						ch: 0
					});
					new Notice(`Converted ${editorSelection || clipboardText}`);
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
					if(!url) throw new Error('Selected text is not a codeblock with a link.');
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

					let newBlock;

					// Check if settings were specified
					if(!content?.[1]) {
						// Create palette without settings
						newBlock = createPaletteBlock({ colors });
					}
					else {
						const settings = JSON.parse(content[1]);
						// Create palette with settings
						createPaletteBlock({ colors, settings });
					}

					if(newBlock) {
						editor.replaceSelection(newBlock);
						new Notice(`Converted codeblock link to hex`);
					}
					else throw new Error('Selected codeblock can not be converted to hex.');
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
				new GenerateModal(this.app, editor, this.settings).open();
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