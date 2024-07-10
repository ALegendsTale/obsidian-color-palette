import colorsea from "colorsea";
import { App, SuggestModal } from "obsidian";
import { Palette, PaletteSettings } from "./Palette";
import { getModifiedSettings } from "utils/basicUtils";

enum Reorder {
    Hue = 'Hue',
    Saturation = 'Saturation',
    Lightness = 'Lightness',
    Red = 'Red',
    Green = 'Green',
    Blue = 'Blue',
    Alpha = 'Alpha'
}

export class ReorderModal extends SuggestModal<Reorder>{
    palette: Palette;
    onSubmit: (colors: string[], settings: Partial<PaletteSettings> | undefined) => void;

    constructor(app: App, palette: Palette, onSubmit: (colors: string[], settings: Partial<PaletteSettings> | undefined) => void) {
        super(app);
        this.palette = palette;
        this.onSubmit = onSubmit;
    }

    // Returns all available suggestions.
    getSuggestions(query: string): Reorder[] {
        return Object.keys(Reorder).filter((combination) =>
            combination.toLowerCase().includes(query.toLowerCase())
        ) as Reorder[];
    }

    renderSuggestion(order: Reorder, el: HTMLElement) {
        el.createEl("span", { text: order });
    }

    onChooseSuggestion(item: Reorder, evt: MouseEvent | KeyboardEvent) {
        // Create colorsea array
        const csColors = this.palette.colors.map((color) => {
            return colorsea(color);
        })
        let colors: string[] = []
        switch(item){
            case Reorder.Hue:
                colors = csColors.sort((a, b) => a.hue() - b.hue()).map((color) => color.hex());
                break;
            case Reorder.Saturation:
                colors = csColors.sort((a, b) => a.saturation() - b.saturation()).map((color) => color.hex());
                break;
            case Reorder.Lightness:
                colors = csColors.sort((a, b) => a.lightness() - b.lightness()).map((color) => color.hex());
                break;
            case Reorder.Red:
                colors = csColors.sort((a, b) => a.red() - b.red()).map((color) => color.hex());
                break;
            case Reorder.Green:
                colors = csColors.sort((a, b) => a.green() - b.green()).map((color) => color.hex());
                break;
            case Reorder.Blue:
                colors = csColors.sort((a, b) => a.blue() - b.blue()).map((color) => color.hex());
                break;
            case Reorder.Alpha:
                colors = csColors.sort((a, b) => a.alpha() - b.alpha()).map((color) => color.hex());
                break;
        }
        
        // Submit
        this.onSubmit( colors, getModifiedSettings(this.palette.settings));
    }
}