import { PaletteSettings } from "src/palette";
import { ColorPaletteSettings, defaultSettings } from "src/settings";

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
    return Object.keys(newSettings).length !== 0 ? newSettings : null;
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
