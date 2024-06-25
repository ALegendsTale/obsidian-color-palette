import quantize, { RgbPixel } from "quantize";

let loading = false;

/**
 * Waits for loading variable to equal true
 */
const waitForLoading = () => new Promise(resolve => {
    const checkLoading = setInterval(() => {
        if (!loading) {
            clearInterval(checkLoading);
            resolve(true);
        }
    }, 100);
})

/**
 * Gets the most frequent colors in an image
 * @param imageURL The URL of the image
 * @param numColors Number of colors to return
 * @param quality Artificially reduce number of pixels (higher = less accurate but faster)
 * @param smoothing Smooths image before processing
 * @returns Most frequent colors
 */
export async function getImagePalette(imageURL: string, numColors: number = 5, quality = 10, smoothing = false) {
    loading = true;
    let context = document.createElement('canvas').getContext('2d');
    // Return early if no context
    if(!context) return [];
    let image = new Image();
    image.src = imageURL;
    // Allows CORS requests for images from different domains
    image.crossOrigin = 'anonymous';

    let palette: RgbPixel[] = [];

    // Waits for image to fully load
    image.addEventListener('load', async (e) => {
        if(!context) return [];
        context.imageSmoothingEnabled = smoothing;
        context.drawImage(image, 0, 0, image.width, image.height);
        const imageData = context.getImageData(0, 0, image.width, image.height).data;

        // Get number of pixels in image
        const pixelCount = image.height * image.width;

        // Get an array of pixels
        const pixels = createPixelArray(imageData, pixelCount, quality) as RgbPixel[]

        // Reduce pixels array to a small number of the most common colors
        const colorMap = quantize(pixels, numColors);

        // Set the palette
        if(colorMap) palette = colorMap.palette();
    
        loading = false;
    })

    await waitForLoading();
    return palette;
}

/**
 * Creates an array of pixels from an image
 * Inspired by colorthief
 * @param imageData The image data context from canvas
 * @param pixelCount Number of pixels in the image
 * @param quality Artificially reduce number of pixels (higher = less accurate but faster)
 * @returns 
 */
function createPixelArray(imageData: Uint8ClampedArray, pixelCount: number, quality: number) {
    const pixelArray: number[][] = [];

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
    return pixelArray;
}