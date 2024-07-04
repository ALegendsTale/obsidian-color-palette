import { Direction } from "settings";
import colorsea from "colorsea";
import validateColor from "validate-color";

export class Canvas {
    container: HTMLElement;
    canvas: HTMLCanvasElement;
    tooltip: HTMLElement;
    tooltipText: HTMLSpanElement;
    context: CanvasRenderingContext2D;

    constructor(container: HTMLElement) {
        this.container = container;
        this.container.addClass('canvas-utils');
        this.canvas = container.appendChild(document.createElement('canvas'));
        this.tooltip = container.appendChild(document.createElement('section'));
        // tooltip is an Obsidian class
        this.tooltip.addClasses(['tooltip', 'palette-tooltip']);
        this.tooltipText = this.tooltip.appendChild(document.createElement('span'));
        // Non-null asserted context
        this.context = this.canvas.getContext('2d', {willReadFrequently: true, alpha: true})!;

        // Check if touch device & add the event listener to the element to track position for the tooltip
        if(!this.isTouchEnabled()) this.canvas.addEventListener("mousemove", (e) => this.setTooltipPosition(e.clientX, e.clientY));
        else this.canvas.addEventListener("touchmove", (e) => this.setTooltipPosition(e.touches[0].clientX, e.touches[0].clientY));
    }

    /**
     * Creates a new gradient canvas
     * @param colors 
     * @param width 
     * @param height 
     * @param direction
     * @param onClick canvas click callback
     */
    public createGradient(colors: string[], width: number, height: number, direction: Direction, onClick: (hex: string, e: MouseEvent) => void) {
        this.canvas.width = width;
        this.canvas.height = height;

        let gradient = direction === Direction.Column ? this.context.createLinearGradient(0, 0, width, 0) : this.context.createLinearGradient(0, 0, 0, height);

        let colorStops: string[] = [];
        for(const[i, color] of colors.entries()){
            // Skip non-colors, even with override enabled. This prevents errors, especially dealing with css-variables which cannot be parsed at run-time.
            if(validateColor(color)) {
                gradient.addColorStop(i / (colors.length - 1), color);
                colorStops.push(color);
            }
        }

        if(colorStops.length <= 1) throw new Error('There are not enough valid color stops to create the gradient.');

        this.context.fillStyle = gradient || '#000';
        this.context.fillRect(0, 0, width, height);

        this.canvas.addEventListener('click', (e) => onClick(this.getCanvasHex(e.clientX, e.clientY), e));

        // Loop through colors but skip last one
        for(const [i, color] of Object.entries(colors).filter((e, i) => i !== colors.length - 1)){
            this.canvas.toggleClass('gradient', true);
            this.canvas.style.setProperty('--palette-background-color', `${color}, ${colors[Number(i) + 1] || 'transparent'}`);
            this.canvas.style.setProperty('--palette-column-flex-basis', (height / colors.length / 2).toString() + 'px');
        }
    }

    // Retrieves the hex from the mouse position
    public getCanvasHex(clientX: number, clientY: number) {
        const canvasBounds = this.canvas.getBoundingClientRect();
        let x = clientX - canvasBounds.left;
        let y = clientY - canvasBounds.top;
        let [r, g, b, a] = this.context.getImageData(x, y, 1, 1).data;
        // Convert alpha from 0-255 to 0-1
        const alpha = Math.round((a/255) * 100);
        // Hide alpha value if not an alpha color
        let hex = alpha !== 255 ? colorsea([r, g, b, alpha]).hex() : colorsea([r, g, b]).hex();
        return hex;
    }

    /**
     * Sets the tooltip position based on current cursor or touch position
     */
    public setTooltipPosition(clientX: number, clientY: number) {
        // Canvas bounds
        const rect = this.canvas.getBoundingClientRect();

        // Get tooltip bounds
        let tooltipWidth = this.tooltip.offsetWidth;
        let tooltipHeight = this.tooltip.offsetHeight;

        // Set tooltip position left or right side of mouse based on whether cursor is halfway
        let leftPosition = clientX - rect.left > rect.width / 2 ? (clientX - rect.left - 56) : (clientX - rect.left + 64);
        let halfTooltipWidth = tooltipWidth / 2;
        // Clamp to left edge
        if (leftPosition < 0 + halfTooltipWidth) leftPosition = 0 + halfTooltipWidth;
        else if (leftPosition + tooltipWidth > rect.width + halfTooltipWidth) leftPosition = rect.width - tooltipWidth + halfTooltipWidth;
        this.tooltip.style.left = leftPosition + "px";

        // Get cursor position & align tooltip centered to cursor (1/4 tooltip height)
        let topPosition = clientY - rect.top - (tooltipHeight / 4);
        // Clamp to top edge
        if (topPosition < 0) topPosition = 0;
        // Clamp to bottom edge
        else if (topPosition + tooltipHeight > rect.height) topPosition = rect.height - tooltipHeight;
        this.tooltip.style.top = topPosition + "px";

        const hex = this.getCanvasHex(clientX, clientY);
        this.tooltipText.setText(hex.toUpperCase());
    }

    /**
     * Checks for touch device
     */
    public isTouchEnabled() {
        return ( 'ontouchstart' in window ) || ( navigator.maxTouchPoints > 0 );
    }
}
