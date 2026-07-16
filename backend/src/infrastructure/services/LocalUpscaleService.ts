/**
 * Coded by Harith
 * Kampungcetak ®
 *
 * FREE image upscaler — no API key, no signup, no per-image cost.
 * Uses UpscalerJS (open-source, MIT licensed), running on TensorFlow.js's
 * Node.js CPU backend, entirely on your own server. Nothing is sent to any
 * third party; the model runs locally and downloads its (free) pretrained
 * weights once on first use, then caches them.
 *
 * Setup required: NONE beyond `npm install` (already added to package.json).
 * First upscale call will be slower as it downloads model weights (~a few
 * MB) into node_modules; every call after that is fast to start.
 */
import * as tf from '@tensorflow/tfjs-node';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const Upscaler = require('upscaler/node');

let upscalerInstance: any = null;
const getUpscaler = () => {
  if (!upscalerInstance) {
    // Uses UpscalerJS's bundled default model — no extra model package to
    // install, no config. It upscales ~2x per pass.
    upscalerInstance = new Upscaler();
  }
  return upscalerInstance;
};

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
  const upscaler = getUpscaler();

  let tensor = tf.node.decodeImage(inputBuffer, 3) as tf.Tensor3D;

  try {
    for (let i = 0; i < passes; i++) {
      const upscaledTensor = (await upscaler.upscale(tensor, { output: 'tensor' })) as tf.Tensor3D;
      tensor.dispose();
      tensor = upscaledTensor;
    }

    const pngBytes = await tf.node.encodePng(tensor);
    return Buffer.from(pngBytes);
  } finally {
    tensor.dispose();
  }
};
