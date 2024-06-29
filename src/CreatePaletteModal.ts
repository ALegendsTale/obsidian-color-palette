import { App, ButtonComponent, ColorComponent, DropdownComponent, Modal, Notice, Setting, SliderComponent, TextComponent } from "obsidian";
import { Palette, PaletteSettings } from "palette";
import { urlRegex } from "main";
import colorsea from "colorsea";
import { Direction, ColorPaletteSettings } from "settings";
import { Combination, generateColors } from "utils/generateRandom";
import { convertStringSettings, createPaletteBlock, getModifiedSettings, parseUrl, pluginToPaletteSettings } from "utils/basicUtils";
import CanvasImage from "utils/imageUtils";

enum SelectedInput {
    Color_Picker = "Color Picker",
    Generate = "Generate",
    Image = "Image",
    URL = "URL",
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
        previewContainer.createEl('h3');

        // Settings
        const settingsContainer = contentEl.createEl('section');
        // Create header for settings section
        settingsContainer.createEl('h3').setText('Settings');

        const colorPickerBtn = new ButtonComponent(controlContainer)
            .setIcon('pipette')
            .setTooltip('Color Picker')
            .onClick((e) => {
                changeSelectedInput(SelectedInput.Color_Picker);
            })
        const generateBtn = new ButtonComponent(controlContainer)
            .setIcon('shuffle')
            .setTooltip('Generate')
            .onClick((e) => {
                changeSelectedInput(SelectedInput.Generate);
            })
        const imageBtn = new ButtonComponent(controlContainer)
            .setIcon('image')
            .setTooltip('Image')
            .onClick((e) => {
                changeSelectedInput(SelectedInput.Image)
            })
        const urlBtn = new ButtonComponent(controlContainer)
            .setIcon('link')
            .setTooltip('URL')
            .onClick((e) => {
                changeSelectedInput(SelectedInput.URL);
            })

        let addColorsContainer = colorsContainer.appendChild(createEl('div'));
        addColorsContainer.addClass('add-colors-container');

        function changeSelectedInput(selectedInput: SelectedInput) {
            resetStyle();
            switch(selectedInput) {
                case SelectedInput.Color_Picker:
                    colorPickerBtn.setCta();
                    addColorsContainer.empty();
                    createColorPicker(addColorsContainer);
                    addColorsContainer.toggleClass('select-color-picker', true);
                    break;
                case SelectedInput.Generate:
                    generateBtn.setCta();
                    addColorsContainer.empty();
                    createGenerate(addColorsContainer);
                    addColorsContainer.toggleClass('select-generate', true);
                    break;
                case SelectedInput.Image:
                    imageBtn.setCta();
                    addColorsContainer.empty();
                    createImage(addColorsContainer);
                    addColorsContainer.toggleClass('select-image', true);
                    break;
                case SelectedInput.URL:
                    urlBtn.setCta();
                    addColorsContainer.empty();
                    createURL(addColorsContainer);
                    addColorsContainer.toggleClass('select-url', true);
                    break;
            }

            function resetStyle() {
                colorPickerBtn.removeCta();
                generateBtn.removeCta();
                imageBtn.removeCta();
                urlBtn.removeCta();
                addColorsContainer.toggleClass('select-color-picker', false);
                addColorsContainer.toggleClass('select-generate', false);
                addColorsContainer.toggleClass('select-image', false);
                addColorsContainer.toggleClass('select-url', false);
            }
        }

        const createColorPicker = (addColorsContainer: HTMLDivElement) => {
            let addColors = new Setting(addColorsContainer)
            .setName("Color Picker")
            .setDesc('Use handpicked colors')

            const colorPickerInput = new ColorComponent(addColors.controlEl)
                .onChange((value) => {
                    this.colors.push(value);
                    this.settings.aliases.push('');
                    updatePalettePreview();
                })
        }

        const createGenerate = (addColorsContainer: HTMLDivElement) => {
            let addColors = new Setting(addColorsContainer)
            .setName("Generate")
            .setDesc('Generate colors based on color theory')

            const dropdownInput = new DropdownComponent(addColors.controlEl)
            // Add dropdown options
            Object.keys(Combination).forEach((combination) => dropdownInput.addOption(combination, combination))
            dropdownInput
                .setValue(this.combination)
                .onChange((value) => {
                    this.combination = value as Combination;
                    // Disable color picker if selected combination is random
                    colorPickerInput.setDisabled(this.combination === Combination.Random ? true : false);
                })

            const colorPickerInput = new ColorComponent(addColors.controlEl)
                .onChange((value) => {
                    this.baseColor = colorsea(value);
                })
                .setDisabled(this.combination === Combination.Random ? true : false);
            const colorPicker = Array.from(addColors.controlEl.children)[1] as HTMLInputElement
            colorPicker.addEventListener('contextmenu', (e) => {
                colorPickerInput.setValue(colorsea('#000').hex());
                this.baseColor = undefined;
            });

            const buttonInput = new ButtonComponent(addColors.controlEl)
                .setIcon('shuffle')
                .setTooltip('Loads the generated colors')
                .onClick((e) => {
                    // Generate colors & settings
                    const generated = generateColors(this.combination, { baseColor: this.baseColor, settings: this.settings });
                    this.colors = generated.colors;
                    if(generated.settings) this.settings = generated.settings;
                    updatePalettePreview();
                })
        }

        const createImage = (addColorsContainer: HTMLDivElement) => {
            // Represents both external & internal image URLs
            let fileURL = '';

            let addColors = new Setting(addColorsContainer)
            .setClass('add-colors')
            .setName("Image")
            .setDesc('Convert image into palette')

            const inputContainer = addColors.controlEl.appendChild(createEl('div'));

            // Contains urlInput, loadButton, & fileInput
            const selectContainer = inputContainer.appendChild(createEl('div'));
            
            const urlInput = new TextComponent(selectContainer)
                .setPlaceholder('Enter URL or select file')
                .onChange((value) => fileURL = value)

            const loadButton = new ButtonComponent(selectContainer)
                .setIcon('arrow-up-to-line')
                .setTooltip('Right click to clear URL')
                .onClick(async (e) => {
                    // Check if any text is present, otherwise prompt user to select image
                    if(urlInput.getValue() !== '') await updateImagePreview(urlInput.getValue());
                    else fileInput.click();
                })
            loadButton.buttonEl.addEventListener('contextmenu', () => urlInput.setValue(''));

            const fileSelector = new TextComponent(selectContainer);
            const fileInput = fileSelector.inputEl;
            fileInput.type = 'file';
            fileInput.accept = 'image/*';
            fileInput.addEventListener('change', (e) => {
                const reader = new FileReader();
                const file = (e.target as HTMLInputElement).files?.[0];
                if(file) reader.readAsDataURL(file);
                
                reader.addEventListener('load', async () => {
                    if(typeof reader.result === 'string') {
                        fileURL = reader.result;
                        await updateImagePreview(fileURL);
                    }
                })
                reader.addEventListener('error', () => {
                    throw new Error('Error processing image.');
                })
            })

            const sliderContainer = new Setting(addColorsContainer)
            .setName('Count')
            .setDesc('Set the number of colors to generate from the image.')

            const countInput = new SliderComponent(sliderContainer.controlEl)
                .setLimits(4, 12, 1)
                .setDynamicTooltip()
                .setValue(8)
                .onChange(async (value) => await updateImagePreview(fileURL))

            const imageContainer = new Setting(addColorsContainer);
            imageContainer.setClass('image-preview');
            imageContainer.setClass('hide-image-preview');

            const imageEl = imageContainer.controlEl.appendChild(createEl('img'));
            imageEl.crossOrigin = 'anonymous';
            imageEl.style.setProperty('border-radius', this.pluginSettings.corners ? '5px' : '0px');
            imageEl.addEventListener('load', () => {
                imageContainer.settingEl.toggleClass('hide-image-preview', false);
            })

            /**
             * Updates the image mode preview
             */
            const updateImagePreview = async (url: string) => {
                if(!url) return;

                imageEl.src = url;
                const canvasImage = new CanvasImage(url);
                const colors = await canvasImage.getPalette(countInput.getValue());
                if(colors) {
                    this.colors = colors.map((color) => colorsea(color).hex(0));
                    this.settings.aliases = [];
                    updatePalettePreview();
                }
            }
        }

        const createURL = (addColorsContainer: HTMLDivElement) => {
            let addColors = new Setting(addColorsContainer)
            .setName("URL")
            .setDesc('Only coolors.co & colorhunt.co are currently supported.')

            const textInput = new TextComponent(addColors.controlEl)
                .setPlaceholder('Enter URL');

            const buttonInput = new ButtonComponent(addColors.controlEl)
                .setIcon('link')
                .setTooltip('Right click to clear URL')
                .onClick((e) => {
                    try {
                        const urlText = textInput.getValue();
                        if(!urlText.match(urlRegex)) throw new Error('URL provided is not valid.');
                        this.colors = parseUrl(urlText);
                        this.settings.aliases = [];
                        updatePalettePreview();
                    }
                    catch(e) {
                        new Notice(e);
                    }
                })
            buttonInput.buttonEl.addEventListener('contextmenu', () => {
                textInput.setValue('');
            })
        }

        // Set intiial selectedInput
        changeSelectedInput(this.selectedInput);

        let palettePreview = previewContainer.appendChild(createDiv());
        palettePreview.addClass('palette-preview');

        const paletteContainer = palettePreview.appendChild(createDiv());
        // Fill palette initially with random colors
        this.colors = generateColors(Combination.Random).colors;
        const palette = new Palette(this.colors, this.settings, paletteContainer, this.pluginSettings);
        palettePreview.appendChild(palette.containerEl);

        /**
         * Updates the palette preview
         */
        const updatePalettePreview = () => {
            palette.colors = this.colors;
            palette.settings = this.settings;
            palette.reload()
            updateTrash();
        }

        const createTrash = (color: string) => {
            const csColor = colorsea(color);
            const contrastColor = (csColor.rgb()[0]*0.299 + csColor.rgb()[1]*0.587 + csColor.rgb()[2]*0.114) > 186 ? '#000000' : '#ffffff';

            let trashContainer = createEl('div');
            trashContainer.addClass('trash-container');
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

            let trash = new ButtonComponent(trashContainer)
                .setIcon('trash-2')
                .setTooltip('Remove')
                .onClick((e) => {
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
                    updatePalettePreview();
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
                    updatePalettePreview();
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
                    updatePalettePreview();
                })
            })

        new Setting(settingsContainer)
            .setName("Gradient")
            .addToggle((toggle) => {
                toggle
                .setValue(this.settings.gradient)
                .onChange((value) => {
                    this.settings.gradient = value;
                    updatePalettePreview();
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
                    updatePalettePreview();
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
                    updatePalettePreview();
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
                    const moddedSettings = getModifiedSettings(convertStringSettings(this.settings));
                    this.onSubmit(createPaletteBlock({colors: this.colors, settings: moddedSettings}));
                    this.close();
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