import quantize, { RgbPixel } from "quantize";
import { Canvas } from "./canvasUtils";

export default class CanvasImage extends Canvas {
    image: HTMLImageElement;
    private loading: boolean;
    width: number;
    height: number;

    constructor(container: HTMLElement, imageURL?: string, smoothing = false) {
        super(container);
        this.canvas.addClass('image');
        this.loading = true;
        this.image = new Image();
        // Allows CORS requests for images from different domains
        this.image.crossOrigin = 'anonymous';
        if(imageURL) this.image.src = imageURL;
        this.image.addEventListener('load', (e) => this.loading = false);
        this.image.addEventListener('error', (e) => {
            throw new Error('The URL provided could not be loaded.');
        })
        this.context.imageSmoothingEnabled = smoothing;
    }

    /**
     * Updates & loads the canvas image.
     * Attempts to preserve aspect ratio based on width.
     * @param width The canvas width
     * @param height The canvas height
     */
    public update(imageURL: string, width: number, height: number) {
        // Set URL
        this.image.src = imageURL;

        // Wait for image to load before calculating dimensions & drawing image to canvas
        this.waitForLoading().then(() => {
            // Calculate the new height based on the aspect ratio
            const aspectRatio = this.image.naturalHeight / this.image.naturalWidth;

            let newWidth = width;
            let newHeight = newWidth * aspectRatio;

            // Ensure the new height fits within the canvas height
            if (newHeight > height) {
                // Adjust width if height exceeds canvas height
                newWidth = height / aspectRatio;
                newHeight = height;
            }

            this.width = this.canvas.width = newWidth;
            this.height = this.canvas.height = newHeight;
            this.context.drawImage(this.image, 0, 0, newWidth, newHeight);
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
        Quantize has an issue with number of colors which has been addressed here https://github.com/olivierlesnicki/quantize/issues/9
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
    public async getImageData(x = 0, y = 0) {
        try {
            await this.waitForLoading();
            return this.context.getImageData(x, y, this.width, this.height);
        }
        catch(e) {
            throw new Error('Failed to get image data.');
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