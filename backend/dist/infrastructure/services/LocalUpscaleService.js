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
Object.defineProperty(exports, "__esModule", { value: true });
exports.upscaleImageLocally = void 0;
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
let tf = null;
let Upscaler = null;
const loadDeps = () => {
    if (!tf) {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        tf = require('@tensorflow/tfjs-node');
    }
    if (!Upscaler) {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        Upscaler = require('upscaler/node');
    }
};
let upscalerInstance = null;
const getUpscaler = () => {
    if (!upscalerInstance) {
        upscalerInstance = new Upscaler();
    }
    return upscalerInstance;
};
const upscaleImageLocally = (_a) => __awaiter(void 0, [_a], void 0, function* ({ inputBuffer, passes = 1, }) {
    loadDeps();
    const upscaler = getUpscaler();
    let tensor = tf.node.decodeImage(inputBuffer, 3);
    try {
        for (let i = 0; i < passes; i++) {
            const upscaledTensor = (yield upscaler.upscale(tensor, { output: 'tensor' }));
            tensor.dispose();
            tensor = upscaledTensor;
        }
        const pngBytes = yield tf.node.encodePng(tensor);
        return Buffer.from(pngBytes);
    }
    finally {
        tensor.dispose();
    }
});
exports.upscaleImageLocally = upscaleImageLocally;
