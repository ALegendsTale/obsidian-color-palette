import colorsea from "colorsea";
import { PaletteSettings } from "src/palette";

export enum Combination {
    Complimentary = "Complimentary",
    Monochromatic = "Monochromatic",
    Analogous = "Analogous",
    Triadic = "Triadic",
    Tetradic = "Tetradic",
    Random = "Random"
}

/**
 * Generate colors based on color theory
 * @param baseColor Initial color to generate the rest from
 * @param combination The type of color theory combination to use
 * @param settings The settings for the palette
 * @returns Generated colors & settings
 */
export function generateColors(baseColor: ReturnType<typeof colorsea>, combination: Combination, settings?: PaletteSettings) {
    let colors: string[] = [];

    switch(combination) {
        case Combination.Complimentary:
            colors = [baseColor.hex(), baseColor.complement().hex()];
            if(settings) settings.aliases = ['Base', 'Complimentary Color'];
            break;
        case Combination.Monochromatic:
            const lightest = baseColor.lighten(20);
            const lighter = baseColor.lighten(10);
            const darker = baseColor.darken(10);
            const darkest = baseColor.darken(20);
            colors = [lightest.hex(), lighter.hex(), baseColor.hex(), darker.hex(), darkest.hex()];
            if(settings) settings.aliases = ['Lightest', 'Lighter', 'Base', 'Darker', 'Darkest'];
            break;
        case Combination.Analogous:
            const east = baseColor.adjustHue(-25);
            const west = baseColor.adjustHue(25);
            colors = [east.hex(), baseColor.hex(), west.hex()];
            if(settings) settings.aliases = ['Analogous East', 'Base', 'Analogous West'];
            break;
        case Combination.Triadic:
            const hex120 = baseColor.spin(120);
            const hex240 = baseColor.spin(240);
            colors = [baseColor.hex(), hex120.hex(), hex240.hex()];
            if(settings) settings.aliases = ['Triadic First', 'Base', 'Triadic Third'];
            break;
        case Combination.Tetradic:
            const hex90 = baseColor.spin(90);
            const hex180 = baseColor.spin(180);
            const hex270 = baseColor.spin(270);
            colors = [baseColor.hex(), hex90.hex(), hex180.hex(), hex270.hex()];
            if(settings) settings.aliases = ['Base', 'Tetradic Second', 'Tetradic Third', 'Tetradic Fourth'];
            break;
        case Combination.Random:
            const randomNumber = Math.round(Math.random() * 10);
            let randomColors: string[] = [];
            for(let i = 0; i < randomNumber; i++){
                randomColors.push(colorsea.random().hex());
            }
            colors = randomColors;
            break;
    }

    return { colors, settings };
}

/**
 * Generate random colors based on color theory
 * @param combination The type of color theory combination to use
 * @param settings The settings for the palette
 * @returns Generated colors & settings
 */
export function generateRandomColors(combination: Combination, settings?: PaletteSettings) {
    const randomHex = colorsea.random();
    return generateColors(randomHex, combination, settings);
}