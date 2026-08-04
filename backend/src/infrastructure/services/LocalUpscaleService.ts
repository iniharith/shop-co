/**
 * Coded by Harith
 * Kampungcetak ®
 *
 * Local image upscaler. Sharp's Lanczos resampling keeps processing on the
 * server without TensorFlow's vulnerable native installer dependency chain.
 */
import sharp from 'sharp';

const MAX_INPUT_PIXELS = 20_000_000;
const MAX_OUTPUT_PIXELS = 12_000_000;
const MAX_OUTPUT_BYTES = 25 * 1024 * 1024;
let activeUpscales = 0;

export class UpscaleBusyError extends Error {}

export interface LocalUpscaleOptions {
  /** Raw bytes of the source image (jpeg/png/bmp/gif). */
  inputBuffer: Buffer;
  /**
   * How many times to run the model back-to-back. The default model
   * upscales ~2x per pass, so 1 pass ≈ 2x, 2 passes ≈ 4x cumulative.
   */
  passes?: 1 | 2;
}

export const upscaleImageLocally = async ({
  inputBuffer,
  passes = 1,
}: LocalUpscaleOptions): Promise<Buffer> => {
  if (activeUpscales >= 1) throw new UpscaleBusyError('The local upscaler is busy');
  activeUpscales += 1;

  try {
    const image = sharp(inputBuffer, { limitInputPixels: MAX_INPUT_PIXELS, failOn: 'warning' });
    const metadata = await image.metadata();
    if (!metadata.width || !metadata.height) throw new Error('Image dimensions could not be read');

    const scale = passes === 2 ? 4 : 2;
    const width = metadata.width * scale;
    const height = metadata.height * scale;
    if (width * height > MAX_OUTPUT_PIXELS) {
      throw new Error('Upscaled image would exceed the safe pixel limit');
    }

    const output = await image
      .resize({ width, height, fit: 'fill', kernel: sharp.kernel.lanczos3 })
      .png({ compressionLevel: 9 })
      .toBuffer();
    if (output.length > MAX_OUTPUT_BYTES) throw new Error('Upscaled image exceeds the safe output size');
    return output;
  } finally {
    activeUpscales -= 1;
  }
};
