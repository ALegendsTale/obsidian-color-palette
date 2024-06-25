import { App, ButtonComponent, ColorComponent, DropdownComponent, Modal, Notice, Setting, TextComponent, setIcon } from "obsidian";
import { Palette, PaletteSettings } from "palette";
import { urlRegex } from "main";
import colorsea from "colorsea";
import { Direction, ColorPaletteSettings } from "settings";
import { Combination, generateColors } from "utils/generateRandom";
import { convertStringSettings, getModifiedSettingsAsString, parseUrl, pluginToPaletteSettings } from "utils/basicUtils";

enum SelectedInput {
    URL = "URL",
    Color_Picker = "Color Picker",
    Generate = "Generate"
}

export class CreatePaletteModal extends Modal {
    pluginSettings: ColorPaletteSettings
    settings: PaletteSettings
    colors: string[]
    selectedInput: SelectedInput
    combination: Combination
    baseColor: ReturnType<typeof colorsea> | undefined
    onSubmit: (result: string) => void

    constructor(app: App, pluginSettings: ColorPaletteSettings, onSubmit: (result: string) => void) {
        super(app);
        this.onSubmit = onSubmit;
        this.pluginSettings = pluginSettings;
        this.settings = pluginToPaletteSettings(pluginSettings);
        this.colors = []
        this.selectedInput = SelectedInput.Color_Picker;
        this.combination = Combination.Random;
        this.baseColor = undefined;
    }

    onOpen(): void {
        const { contentEl } = this;
        
        // Header
        contentEl.createEl('h1', { text: 'Create Palette' })
        contentEl.addClass('create-palette');

        // Add Colors
        const colorsContainer = contentEl.createEl('section');
        // Create header for colors section
        colorsContainer.createEl('h3').setText('Add Colors');

        // Tabs
        let controlContainer = colorsContainer.appendChild(createDiv());
        controlContainer.addClass('control-container');

        // Preview
        const previewContainer = contentEl.createEl('section');
        previewContainer.createEl('h3').setText('Preview');

        // Settings
        const settingsContainer = contentEl.createEl('section');
        // Create header for settings section
        settingsContainer.createEl('h3').setText('Settings');

        const urlBtn = controlContainer.appendChild(createEl('button'));
        setIcon(urlBtn, 'link');
        urlBtn.title = 'URL';
        urlBtn.addEventListener('click', () => {
            changeSelectedInput(SelectedInput.URL);
        })
        const colorPickerBtn = controlContainer.appendChild(createEl('button'));
        setIcon(colorPickerBtn, 'pipette');
        colorPickerBtn.title = 'Color Picker';
        colorPickerBtn.addEventListener('click', () => {
            changeSelectedInput(SelectedInput.Color_Picker);
        })
        const generateBtn = controlContainer.appendChild(createEl('button'));
        setIcon(generateBtn, 'shuffle');
        generateBtn.title = 'Generate';
        generateBtn.addEventListener('click', () => {
            changeSelectedInput(SelectedInput.Generate);
        })

        let addColorsContainer = new Setting(colorsContainer);
        addColorsContainer.controlEl.addClass('add-colors');

        function changeSelectedInput(selectedInput: SelectedInput) {
            resetStyle();
            switch(selectedInput) {
                case SelectedInput.Color_Picker:
                    colorPickerBtn.style.setProperty('background', 'rgb(138, 92, 245)');
                    addColorsContainer.clear();
                    createColorPicker(addColorsContainer);
                    addColorsContainer.controlEl.toggleClass('select-color-picker', true);
                    break;
                case SelectedInput.Generate:
                    generateBtn.style.setProperty('background', 'rgb(138, 92, 245)');
                    addColorsContainer.clear()
                    createGenerate(addColorsContainer);
                    addColorsContainer.controlEl.toggleClass('select-generate', true);
                    break;
                case SelectedInput.URL:
                    urlBtn.style.setProperty('background', 'rgb(138, 92, 245)');
                    addColorsContainer.clear();
                    createURL(addColorsContainer);
                    addColorsContainer.controlEl.toggleClass('select-url', true);
                    break;
            }

            function resetStyle() {
                colorPickerBtn.style.setProperty('background', 'rgb(49, 50, 68)');
                generateBtn.style.setProperty('background', 'rgb(49, 50, 68)');
                urlBtn.style.setProperty('background', 'rgb(49, 50, 68)');
                addColorsContainer.controlEl.toggleClass('select-color-picker', false);
                addColorsContainer.controlEl.toggleClass('select-generate', false);
                addColorsContainer.controlEl.toggleClass('select-url', false);
            }
        }

        const createColorPicker = (addColors: Setting) => {
            addColors
            .setName("Color Picker")
            .setDesc('Use handpicked colors')
            .addColorPicker((color) => {
                color.onChange((value) => {
                    this.colors.push(value);
                    this.settings.aliases.push('');
                    updatePreview();
                })
            })

            const [colorPickerInput] = addColors.components as [ColorComponent];
        }

        const createGenerate = (addColors: Setting) => {
            addColors
            .setName("Generate")
            .setDesc('Generate colors based on color theory')
            .addDropdown((dropdown) => {
                Object.keys(Combination).forEach((combination) => {
                    dropdown.addOption(combination, combination);
                })
                dropdown
                .setValue(this.combination)
                .onChange((value) => {
                    this.combination = value as Combination;
                    // Disable color picker if selected combination is random
                    colorPickerInput.setDisabled(this.combination === Combination.Random ? true : false);
                })
            })
            .addColorPicker((color) => {
                color.onChange((value) => {
                    this.baseColor = colorsea(value);
                })
                color.setDisabled(this.combination === Combination.Random ? true : false);
                const colorPicker = Array.from(addColors.controlEl.children)[1] as HTMLInputElement
                colorPicker.addEventListener('contextmenu', (e) => {
                    color.setValue(colorsea('#000').hex());
                    this.baseColor = undefined;
                });
            })
            .addButton((button) => {
                button.setIcon('shuffle')
                button.onClick((e) => {
                    // Generate colors & settings
                    const generated = generateColors(this.combination, { baseColor: this.baseColor, settings: this.settings });
                    this.colors = generated.colors;
                    if(generated.settings) this.settings = generated.settings;

                    updatePreview();
                })
            })
    
            const [dropdownInput, colorPickerInput, buttonInput] = addColors.components as [DropdownComponent, ColorComponent, ButtonComponent];
        }

        const createURL = (addColors: Setting) => {

            addColors
            .setName("URL")
            .setDesc('Only coolors.co & colorhunt.co are currently supported.')
            .addText((text) => {
                text.setPlaceholder('Enter URL');
            })
            .addButton((button) => {
                button.setIcon('link');
                button.setTooltip('Right click to clear URL');
                button.onClick((e) => {
                    try {
                        const urlText = textInput.getValue();
                        if(!urlText.match(urlRegex)) throw new Error('URL provided is not valid.');
                        this.colors = parseUrl(urlText);
                        this.settings.aliases = [];
                        updatePreview();
                    }
                    catch(e) {
                        new Notice(e);
                    }
                })
            })

            const [textInput, buttonInput] = addColors.components as [TextComponent, ButtonComponent];

            buttonInput.buttonEl.addEventListener('contextmenu', () => {
                textInput.setValue('');
            })
        }

        // Set intiial selectedInput
        changeSelectedInput(this.selectedInput);

        let colorPreview = previewContainer.appendChild(createDiv());
        colorPreview.addClass('color-preview');

        const colorPreviewPalette = colorPreview.appendChild(createDiv());
        // Fill palette initially with random colors
        this.colors = generateColors(Combination.Random).colors;
        const palette = new Palette(this.colors, this.settings, colorPreviewPalette, this.pluginSettings);
        colorPreview.appendChild(palette.containerEl);

        /**
         * Updates the palette preview
         */
        const updatePreview = () => {
            palette.colors = this.colors;
            palette.settings = this.settings;
            palette.reload()
            updateTrash();
        }

        const createTrash = (color: string) => {
            let trashContainer = createEl('div');
            trashContainer.addClass('trash-container');

            const csColor = colorsea(color);
            const contrastColor = (csColor.rgb()[0]*0.299 + csColor.rgb()[1]*0.587 + csColor.rgb()[2]*0.114) > 186 ? '#000000' : '#ffffff';

            trashContainer.style.setProperty('--trash-background-color', color);
            trashContainer.style.setProperty('--trash-color', contrastColor);
            
            let colorSpan = trashContainer.createEl('span');
            colorSpan.setText(this.settings.aliases[this.colors.findIndex(val => val === color)] || color.toUpperCase());
            colorSpan.style.setProperty('--trash-font-size', `${getAdjustedFontSize(this.colors)}px`);

            let storedAlias = colorSpan.getText();

            // Focus color & allow for editing alias
            colorSpan.addEventListener('click', (e) => {
                e.stopPropagation();
                setEditable(true);
                colorSpan.focus();
            })
            colorSpan.addEventListener('keypress', (e) => {
                if(e.key === 'Enter') {
                    setAlias();
                    setEditable(false);
                }
            })
            // Set alias if changed & de-focus
            colorSpan.addEventListener('focusout', (e) => {
                setAlias();
                setEditable(false);
            })

            const setAlias = () => {
                // Reset span text to original if user left it empty
                if(colorSpan.getText().trim() === '') colorSpan.setText(storedAlias);
                // Set alias color if user modified text
                else if(colorSpan.getText() !== color) this.settings.aliases[this.colors.findIndex(val => val === color)] = colorSpan.getText();
            }

            const setEditable = (editable: boolean) => {
                if(editable === true) {
                    storedAlias = colorSpan.getText();
                    colorSpan.setText('');
                }
                colorSpan.contentEditable = `${editable}`;
                colorSpan.toggleClass('color-span-editable', editable);
            }

            /**
             * Calculate font size based on number of colors
             */
            function getAdjustedFontSize(colors: string[]) {
                const minFontSize = 10;
                const baseFontSize = 16;
                return Math.max(minFontSize, baseFontSize - (colors.length / 2));
            }

            let trash = trashContainer.createEl('button');
            setIcon(trash, 'trash-2');
            trash.addEventListener('click', (e) => {
                e.stopPropagation();
                const deletedIndex = this.colors.indexOf(color);
                this.colors.splice(deletedIndex, 1);
                this.settings.aliases.splice(deletedIndex, 1);
                palette.reload();
                updateTrash();
            })
            return trashContainer;
        }

        /**
         * Updates trash based on palette children
         */
        const updateTrash = () => {
            // Check for invalid settings
            const incompatibleSettings = this.settings.direction === Direction.Row || this.settings.gradient === true;
            // Return early if there are no colors, or if incompatible settings are present.
            if(this.colors.length === 0 || incompatibleSettings) return;
            for(const [index, child] of Array.from(palette.containerEl.children).entries()){
                child.appendChild(createTrash(this.colors[index]));
            }
        }

        updateTrash();

        new Setting(settingsContainer)
            .setName("Height")
            .addText((text) => {
                text
                .setValue(this.settings.height.toString())
                .onChange((value) => {
                    this.settings.height = Number(value);
                    updatePreview();
                })
            })

        new Setting(settingsContainer)
            .setName("Width")
            .setDesc('Caution - Might cause palette to display incorrectly.')
            .addText((text) => {
                text
                .setValue(this.settings.width.toString())
                .onChange((value) => {
                    this.settings.width = Number(value);
                    updatePreview();
                })
            })

        new Setting(settingsContainer)
            .setName("Direction")
            .addDropdown((dropdown) => {
                dropdown
                .addOption(Direction.Column, Direction.Column)
                .addOption(Direction.Row, Direction.Row)
                .setValue(this.settings.direction.toString())
                .onChange((value) => {
                    this.settings.direction = value as Direction;
                    updatePreview();
                })
            })

        new Setting(settingsContainer)
            .setName("Gradient")
            .addToggle((toggle) => {
                toggle
                .setValue(this.settings.gradient)
                .onChange((value) => {
                    this.settings.gradient = value;
                    updatePreview();
                })
            })

        new Setting(settingsContainer)
            .setName("Hover")
            .setDesc("Toggles whether palettes can be hovered")
            .addToggle((toggle) => {
                toggle
                .setValue(this.settings.hover)
                .onChange(async (value) => {
                    this.settings.hover = value;
                    updatePreview();
                })
            })

        new Setting(settingsContainer)
            .setName("Override")
            .setDesc("Disables color validation for full control (advanced)")
            .addToggle((toggle) => {
                toggle
                .setValue(this.settings.override)
                .onChange(async (value) => {
                    this.settings.override = value;
                    updatePreview();
                })
            })

        new Setting(settingsContainer)
        .addButton((button) => 
            button
            .setButtonText("Create")
            .setCta()
            .onClick(() => {
                try{
                    // Generate random colors if none are provided
                    if(this.colors.length === 0) this.colors = generateColors(Combination.Random).colors;
                    const moddedSettings = getModifiedSettingsAsString(convertStringSettings(this.settings));
                    this.close();
                    this.onSubmit(`${this.colors.toNString()}${moddedSettings ? `\n${moddedSettings}` : ''.trim()}`);
                }
                catch(e){
                    new Notice(e);
                }
            })
        )
    }

    onClose(): void {
        let { contentEl } = this;
        contentEl.empty();
    }
}