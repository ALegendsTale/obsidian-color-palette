import { Notice } from "obsidian";
import quantize, { RgbPixel } from "quantize";

export default class CanvasImage {
    image: HTMLImageElement;
    canvas: HTMLCanvasElement;
    context: CanvasRenderingContext2D;
    width: number;
    height: number;
    loading: boolean;

    constructor(imageURL: string, smoothing = false) {
        this.loading = true;
        this.image = new Image();
        // Allows CORS requests for images from different domains
        this.image.crossOrigin = 'anonymous';
        this.image.src = imageURL;
        this.image.addEventListener('load', (e) => this.loading = false);
        this.canvas  = document.createElement('canvas');
        // Non-null asserted context
        this.context = this.canvas.getContext('2d')!;
        this.context.imageSmoothingEnabled = smoothing;

        this.load();
    }

    load() {
        this.waitForLoading().then(() => {
            this.width  = this.canvas.width  = this.image.naturalWidth;
            this.height = this.canvas.height = this.image.naturalHeight;
            this.context.drawImage(this.image, 0, 0, this.width, this.height);
        })
    }

    /**
     * Gets the most frequent colors in an image
     * @param numColors Number of colors to return
     * @param quality Artificially reduce number of pixels (higher = less accurate but faster)
     * @returns Most frequent colors
     */
    public async getPalette(numColors = 7, quality = 10) {
        /*
        Quanitze has an issue with number of colors which has been addressed here https://github.com/olivierlesnicki/quantize/issues/9
        `nColors` is a simple fix for this.
        */
        const nColors = numColors <= 7 ? numColors : numColors + 1;

        // Wait for image to load
        await this.waitForLoading();

        // Get an array of pixels
        const pixels = await this.createPixelArray(quality);
        if(!pixels) return null;

        // Reduce pixels array to a small number of the most common colors
        const colorMap = quantize(pixels, nColors);
    
        // Return palette
        return colorMap ? colorMap.palette() : [];
    }

    /**
     * Creates an array of pixels from the image
     * Inspired by colorthief
     * @param quality Artificially reduce number of pixels (higher = less accurate but faster)
     * @returns 
     */
    public async createPixelArray(quality: number) {
        await this.waitForLoading();
        const pixelArray: number[][] = [];
        const imageData =  (await this.getImageData())?.data;
        if(!imageData) return null;
        // Get number of pixels in image
        const pixelCount = this.height * this.width;

        for (let i = 0; i < pixelCount; i += quality) {
            // Offset to correct starting position of each pixel
            const offset = i * 4;
            const [r, g, b, a] = [imageData[offset + 0], imageData[offset + 1], imageData[offset + 2], imageData[offset + 3]];

            // If pixel is mostly opaque and not white
            if (typeof a === 'undefined' || a >= 125) {
                if (!(r > 250 && g > 250 && b > 250)) {
                    pixelArray.push([r, g, b]);
                }
            }
        }
        return pixelArray as RgbPixel[];
    }

    /**
     * Gets the image data from the canvas
     */
    public async getImageData() {
        try {
            await this.waitForLoading();
            return this.context.getImageData(0, 0, this.width, this.height);
        }
        catch(e) {
            new Notice('Failed to get image data.');
            return null;
        }
    }

    /**
     * Waits for loading variable to equal true
     */
    private waitForLoading = () => new Promise(resolve => {
        const checkLoading = setInterval(() => {
            if (!this.loading) {
                clearInterval(checkLoading);
                resolve(true);
            }
        }, 100);
    })
}