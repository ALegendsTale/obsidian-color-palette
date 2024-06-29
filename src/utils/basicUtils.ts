import { PaletteSettings } from "palette";
import { ColorPaletteSettings, defaultSettings } from "settings";

/**
 * Get settings without their default values
 */
export function getModifiedSettings (settings: PaletteSettings) {
    let newSettings: Partial<PaletteSettings> = {};

    for(const [key, value] of Object.entries(settings)) {
        const defaultVal = defaultSettings[key as keyof ColorPaletteSettings];

        // Check if setting is a key in defaultSettings
        if(key in defaultSettings) {
            // Check if setting is equal to default & keep setting if not equal
            if(value !== defaultVal) newSettings = { ...newSettings, [key]: value};
        }
        // Add all other settings not defined in defaults
        else {
            // Break if empty array
            if(value instanceof Array && value.length === 0) break;
            // Add setting
            else newSettings = { ...newSettings, [key]: value };
        }
    }

    // Return null if newSettings is empty
    return Object.keys(newSettings).length !== 0 ? newSettings : undefined;
}

/**
 * Checks if all settings are set to their default values
 */
export function areSettingsDefault (settings: PaletteSettings | ColorPaletteSettings) {
    for(const [key, value] of Object.entries(settings)) {
        // Ignore settings that don't have a default counterpart
        if(!(key in defaultSettings)) return true;
        // Check if any settings are not default
        if(value !== defaultSettings[key as keyof ColorPaletteSettings]) {
            return false;
        }
    }
    return true;
}

/**
 * Gets the modified settings as a string
 */
export function getModifiedSettingsAsString (settings: PaletteSettings) {
    const moddedSettings = getModifiedSettings(settings);
    if(moddedSettings) return JSON.stringify(moddedSettings);
}

export function convertStringSettings(settings: PaletteSettings) {
    return JSON.parse(
        `{
        "height": ${settings.height}, 
        "direction": "${settings.direction}", 
        "gradient": ${settings.gradient}, 
        "hover": ${settings.hover}, 
        "override": ${settings.override}, 
        "aliases": ${JSON.stringify(settings.aliases)}
        }`
    )
}

/**
 * Parse input url & extract colors
 * @param url URL from color input
 * @returns Array of colors
 */
export function parseUrl(url: string) {
    // Check if url colors contain dashes in-between
    if(url.includes('-')) {
        // Replace dashes with hexes (colorhunt)
        return url.substring(url.lastIndexOf('/') + 1).split('-').map(i => '#' + i);
    }
    // Add hex between URL path colors (coolors)
    else return url.substring(url.lastIndexOf('/') + 1).match(/.{1,6}/g)?.map(i => '#' + i) || [];
}

/**
 * Converts ColorPalette plugin settings to Palette settings
 */
export function pluginToPaletteSettings(pluginSettings: ColorPaletteSettings): PaletteSettings {
    return { 
        height: pluginSettings.height, 
        width: pluginSettings.width, 
        direction: pluginSettings.direction, 
        gradient: pluginSettings.gradient, 
        hover: pluginSettings.hover, 
        override: pluginSettings.override, 
        aliases: [] 
    };
}

/**
 * Creates a codeblock palette
 * @param input Either palette input or colors & settings object
 * @returns palette block string
 */
export function createPaletteBlock(input: { colors: string[],settings?: Partial<PaletteSettings> } | string): string {
    if(typeof input === 'string') return `\`\`\`palette\n${input}\n\`\`\`\n`;
    else return input.settings ? `\`\`\`palette\n${input.colors.toNString()}\n${JSON.stringify(input.settings)}\n\`\`\`\n` : `\`\`\`palette\n${input.colors.toNString()}\n\`\`\`\n`;
}