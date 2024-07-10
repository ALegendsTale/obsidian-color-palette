# Commands

## Create

Launches the palette editor to create a new palette.
The editor will always initially launch with random palette colors.

The editor has tabs which can be swapped between to add colors.
These tabs are **Color Picker**, **Generate**, **Image**, and **URL**.

### Colors

#### Color Picker

Simply open the color picker, select a color, then select the editor again to add a color.

#### Generate

The Generate tab comes with a dropdown where the preferred color theory can be chosen.
Next to the dropdown is a color picker which can be used to choose a base color for whichever color theory was chosen.

#### Image

The Image tab can accept a URL or the user can select the button to choose a file to use.

When a file is selected, the image preview will be unhidden and it will generate colors based on the image.
The user can change the `Count` slider to a value they prefer for generating colors.
Alternatively, colors can be picked directly from the image.

#### URL

The palette can be created from a URL.

> URLs are currently limited to <https://coolors.co> & <https://colorhunt.co>.

### Settings

[Palette Settings](./PaletteSettings.md) can be modified here.
They will affect the palette preview so that the appearance can be determined before creating it.

## Convert link

This command can be used by selecting a URL or by using one copied from the clipboard.
It will create a palette from that URL.

## Convert codeblock link to hex

> This command is mostly deprecated. Please use the right click menu instead.

This command takes a selected codeblock with a link inside and converts the link within into hex.

Converts
<pre>
```palette
https://colorhunt.co/palette/3ec1d3f6f7d7ff9a00ff165d
```
</pre>

into

<pre>
```palette
#3ec1d3
#f6f7d7
#ff9a00
#ff165d
```
</pre>

## Generate random palette

Generates a random palette based on which color theory is selected in the suggestion modal.
