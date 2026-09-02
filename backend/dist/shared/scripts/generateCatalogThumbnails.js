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
/** Generate small catalog thumbnails used by product-card surfaces. */
const promises_1 = __importDefault(require("node:fs/promises"));
const node_path_1 = __importDefault(require("node:path"));
const sharp_1 = __importDefault(require("sharp"));
const sourceDir = node_path_1.default.resolve(__dirname, '../../../../frontend/public/images/catalog');
const outputDir = node_path_1.default.join(sourceDir, 'thumbs');
const main = () => __awaiter(void 0, void 0, void 0, function* () {
    yield promises_1.default.mkdir(outputDir, { recursive: true });
    const files = (yield promises_1.default.readdir(sourceDir)).filter((file) => file.endsWith('.webp'));
    yield Promise.all(files.map((file) => __awaiter(void 0, void 0, void 0, function* () {
        yield (0, sharp_1.default)(node_path_1.default.join(sourceDir, file))
            .resize({ width: 320, withoutEnlargement: true })
            .webp({ quality: 75 })
            .toFile(node_path_1.default.join(outputDir, file));
    })));
    console.log(`Generated ${files.length} catalog thumbnails in ${outputDir}`);
});
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
