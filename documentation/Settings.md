# Settings

Plugin settings can be specified in the settings modal in Obsidian.

## Primary Settings

### Palette Error Pulse

> Default: True

Toggle which affects whether the affected palette will pulse when encountering an error.

### Notice Duration

> Default: 5

`number` which affects how long error messages are shown for in seconds (0 for indefinite).

### Alias Mode

> Default: Both

Dropdown which has `Both` and `Prefer Alias` options.

- When `Both` is selected, both the color format & alias will show at the same time.
- When `Prefer Alias` is selected, only the alias will show.

### Palette Corners

> Default: True

Purely aesthetic change which toggles whether the corners on palettes are rounded.

### Hover while editing

> Default: False

Toggles whether hover is active while editing.

### Reload Delay

> Default: 5

Modifies the speed at which the palette will reload when resizing or changing.
Smaller values means the palette will be more responsive, but require more processing.
It is recommended to keep this value between 0 - 1000.

### Copy Format

> Default: Raw

Changes the format that colors are copied in. `Raw` format copies the entire color as show.
`Value` format copies only the value contained within a color.
Example: `RGBA(12, 200, 50);` Only `12, 200, 50` is copied.

## Palette Defaults

The default values of [Palette Settings](./PaletteSettings.md) if the user does not directly modify them.

### Height

> Default: 150

### Width

> Default: 700

### Direction

> Default: Column

### Gradient

> Default: False

### Hover

> Default: True

### Override

> Default: False
