# Color Palette

Create beautiful & functional color palettes that enhance the appearance of your notes.

![Color Palette Demo](ColorPaletteDemo.png)

## Key Features
- Create color palettes from popular palette websites like coolors & colorhunt.
- Style like a pro with gorgeous gradients.
- Convert links already present within your notes into palettes.
- Easily copy the hex code of a color by selecting it.

## Usage

Palettes can be created manually by adding a codeblock with the hex codes desired.\
*Currently only supports hex values.*

<pre>
```palette
#ffffff, #000
```
</pre>

Palettes can also be created from links.\
*Only URLs from https://coolors.co & https://colorhunt.co are currently supported.*

<pre>
```palette
https://colorhunt.co/ffffff
```
</pre>

Optional settings can be applied to each palette within the codeblock.
<pre>
```palette
#fff, #000fff00
{"gradient": true}
```
</pre>

### Optional Settings
- gradient (true/false)
- direction (row/column)
- height (number)

### Commands
Commands can be bound to a hotkey in settings.

- Create - Creates a new palette using the colors or URL provided
- Convert Link - Converts a selected URL to a palette
- Convert codeblock link to hex