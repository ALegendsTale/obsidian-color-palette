# Palette Settings

**Palette Settings** are settings which are directly specified in the palette codeblock.
<pre>
```palette
#000
{  } 🠨 Specify palette settings here
```
</pre>
They can be used to modify height, width, direction, gradient, hover, override, and aliases.

## Height

Height can be set to modify how tall the palette is.

Example:

<pre>
```palette
#f6f7d7
#3EC1D3
#FF165D
#FF9A00
#f6f7d7
{ "height": 300 }
```

</pre>

## Width

Width can be set to modify how wide the palette is.
Be cautious when using this setting, as it can sometimes cause palettes to appear deformed.

<pre>
```palette
#999
#222
{ "width": 400 }
```
</pre>

## Direction

Direction can be set to change which direction the palette colors face.
`column` is the default and appears vertically. `row` causes horizontal colors.

<pre>
```palette
#afc
#b31
{ "direction": "row" }
```
</pre>

## Gradient

The gradient setting toggles whether palette colors will appear as a gradient.

<pre>
```palette
#3ec1d3
#f6f7d7
#ff9a00
#ff165d
{ "gradient": true }
```
</pre>

## Hover

Hover controls whether palettes have any effect when hovered over with the mouse cursor.
It also controls this on mobile when touching palettes.
When disabled, color / alias text will show by default unless Hide Text is enabled.

<pre>
```palette
#8ec178
#25136d
{ "hover": false }
```
</pre>

## Hide Text

Hide Text toggles whether palettes display color / alias text.

<pre>
```palette
#8ec178
#25136d
{ "hideText": true }
```
</pre>

## Override

The override setting defaults to false.
When set to true, it disables color validation.
This is useful for creating palettes with atypical inputs (css variables for example).
The [Obsidian Color Documentation](https://docs.obsidian.md/Reference/CSS+variables/Foundations/Colors) is a great source for finding colors that match Obsidian.

Example:
Ordinarily using CSS variables would not be permitted.
When override is set to true, the palette will render.

<pre>
```palette
var(--color-orange)
{ "override": true }
```
</pre>

Advanced Example:
Using RGBA with a RGB CSS variable can allow the opacity to be set.

<pre>
```palette
rgba(var(--color-green-rgb), .5)
{ "override": true }
```
</pre>

## Aliases

Aliases are names which accompany colors.
They can be set in an array format.
Each color has its own spot in the array.
Skipping colors is possible by using empty quotes "".

<pre>
```palette
#444
#222
#322
{ "aliases": ["grey","black","brown"] }
```
</pre>
