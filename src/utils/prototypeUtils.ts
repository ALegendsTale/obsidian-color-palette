interface Array<T> {
    toNString(): string
}

/**
 * Converts string array to newline separated string
 */
Array.prototype.toNString = function() {
    let result = '';
    for (const string of this) {
        result += string + '\n';
    }
    return result.trim();
}