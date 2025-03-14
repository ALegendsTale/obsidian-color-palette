# Color Palette

Create beautiful & functional color palettes that enhance the appearance of your notes.

![Color Palette Demo](ColorPaletteDemo.png)

## Key Features

- Supports most CSS color formats (including Hex, RGB, HSL, etc.)
- Create color palettes from popular palette websites like coolors & colorhunt.
- Style like a pro with gorgeous gradients.
- Easily copy color codes by selecting them.

## Full Documentation

[Documentation](/documentation/index.md)

## Quick Start

Palettes can be created manually by adding a codeblock with the color codes desired.

<pre>
```palette
#ffffff, #000
```
</pre>

<pre>
```palette
rgb(125, 255, 255);
rgb(255, 255, 125);
```
</pre>

Palettes can also be created from links.\
*Only URLs from <https://coolors.co> & <https://colorhunt.co> are currently supported.*

<pre>
```palette
https://colorhunt.co/ffffff
```
</pre>

Optional settings can be applied to each palette within the codeblock.
<pre>
```palette
#fff, #000fff00
{"gradient": true, "aliases": ["white", "black"]}
```
</pre>

### Palette Settings

- height (number)
- width (number)
- direction (row/column)
- gradient (true/false)
- hover (true/false)
- hideText (true/false)
- override (true/false)
- aliases (string array)

> Caution - using width might cause palettes to display incorrectly.

### Commands

Commands can be bound to a hotkey in settings.

- Create - Advanced palette editor
- Convert link - Converts a selected URL to a palette
- Convert codeblock link to hex
- Generate random palette - Creates a new random palette based on color theory combinations
