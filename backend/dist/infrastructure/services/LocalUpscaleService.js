"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.upscaleImageLocally = exports.UpscaleBusyError = void 0;
/**
 * Coded by Harith
 * Kampungcetak ®
 *
 * Local image upscaler. Sharp's Lanczos resampling keeps processing on the
 * server without TensorFlow's vulnerable native installer dependency chain.
 */
const sharp_1 = __importDefault(require("sharp"));
const MAX_INPUT_PIXELS = 20000000;
const MAX_OUTPUT_PIXELS = 12000000;
const MAX_OUTPUT_BYTES = 25 * 1024 * 1024;
let activeUpscales = 0;
class UpscaleBusyError extends Error {
}
exports.UpscaleBusyError = UpscaleBusyError;
const upscaleImageLocally = (_a) => __awaiter(void 0, [_a], void 0, function* ({ inputBuffer, passes = 1, }) {
    if (activeUpscales >= 1)
        throw new UpscaleBusyError('The local upscaler is busy');
    activeUpscales += 1;
    try {
        const image = (0, sharp_1.default)(inputBuffer, { limitInputPixels: MAX_INPUT_PIXELS, failOn: 'warning' });
        const metadata = yield image.metadata();
        if (!metadata.width || !metadata.height)
            throw new Error('Image dimensions could not be read');
        const scale = passes === 2 ? 4 : 2;
        const width = metadata.width * scale;
        const height = metadata.height * scale;
        if (width * height > MAX_OUTPUT_PIXELS) {
            throw new Error('Upscaled image would exceed the safe pixel limit');
        }
        const output = yield image
            .resize({ width, height, fit: 'fill', kernel: sharp_1.default.kernel.lanczos3 })
            .png({ compressionLevel: 9 })
            .toBuffer();
        if (output.length > MAX_OUTPUT_BYTES)
            throw new Error('Upscaled image exceeds the safe output size');
        return output;
    }
    finally {
        activeUpscales -= 1;
    }
});
exports.upscaleImageLocally = upscaleImageLocally;
