# Colors

## Color Formats

There are three primarily supported color formats.
These are **HEX**, **RGB**, and **HSL**. **Named colors** & **URL** can also be used.

### HEX

3, 4, 6, or 8 character HEX codes are all accepted.
HEX are delimited by commas.

<pre>
```palette
#434
#f6f7d7
```
</pre>

### RGB

RGB can be specified in both RGB and RGBA formats.

<pre>
```palette
rgb(123, 555, 777)
rgba(122, 222, 772, .7)
```
</pre>

### HSL

<pre>
```palette
hsl(5, 20%, 70%)
hsl(5, 70%, 70%)
```
</pre>

### Named Colors

Named CSS colors are also supported.

<pre>
```palette
grey
pink
```
</pre>

### URLs

> URLs are currently limited to <https://coolors.co> & <https://colorhunt.co>.

<pre>
```palette
https://colorhunt.co/palette/3ec1d3f6f7d7ff9a00ff165d
```
</pre>

## Delimiters

Colors can be specified when creating palettes in many different ways.
The main delimiters include **newline**, **comma**, and **semicolon**.

### Newline

Newline is the preferred delimiter for all formats.

<pre>
```palette
#434
#f6f7d7
```
</pre>

### Comma

<pre>
```palette
#434, #f6f7d7, #3EC1D3, #FF165D, #FF9A00, #f6f7d7
```
</pre>

### Semicolon

Semicolon delimiters can be used with the `RGB` and `HSL` formats.

<pre>
```palette
rgb(123, 555, 777); rgb(122, 222, 772);
```
</pre>
