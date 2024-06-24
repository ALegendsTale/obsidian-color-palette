import colorsea from "colorsea";
import { PaletteSettings } from "palette";

export enum Combination {
    Complimentary = "Complimentary",
    Monochromatic = "Monochromatic",
    Analogous = "Analogous",
    Triadic = "Triadic",
    Tetradic = "Tetradic",
    Random = "Random"
}

type OptionalParams = {
    baseColor?: ReturnType<typeof colorsea>
    settings?: PaletteSettings
}

/**
 * Generate colors based on color theory
 * @param baseColor Initial color to generate the rest from
 * @param combination The type of color theory combination to use
 * @param settings The settings for the palette
 * @returns Generated colors & settings
 */
export function generateColors(combination: Combination, optional: OptionalParams = { baseColor: colorsea.random() }) {
    let { baseColor, settings } = optional;
    // Never called because baseColor is set by default in parameters
    if(!baseColor) baseColor = colorsea.random();
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
            // Clamp to a minimum value of 2
            const randomNumber = Math.max(Math.round(Math.random() * 10), 2);
            let randomColors: string[] = [];
            for(let i = 0; i < randomNumber; i++){
                randomColors.push(colorsea.random().hex());
            }
            colors = randomColors;
            if(settings) settings.aliases = [];
            break;
    }

    return { colors, settings };
}