"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
const express_1 = require("express");
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const auth_middileware_1 = __importStar(require("../middlewares/auth.middileware"));
const DiyTemplateOverride_1 = require("../../domain/entities/DiyTemplateOverride");
const router = (0, express_1.Router)();
const sourceUrl = () => process.env.DIY_TEMPLATE_SOURCE_URL || 'https://diy.kampungcetak.com/api/diy-template-library';
let cached = null;
const sourceTemplates = () => __awaiter(void 0, void 0, void 0, function* () {
    if (cached && cached.expiresAt > Date.now())
        return cached.templates;
    const response = yield fetch(sourceUrl(), { signal: AbortSignal.timeout(15000) });
    if (!response.ok)
        throw new Error(`DIY template source returned ${response.status}`);
    const body = yield response.json();
    if (!Array.isArray(body.templates))
        throw new Error('DIY template source returned an invalid library');
    cached = { templates: body.templates, expiresAt: Date.now() + 30000 };
    return cached.templates;
});
router.get('/', (0, express_async_handler_1.default)((_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const [templates, overrides] = yield Promise.all([sourceTemplates(), DiyTemplateOverride_1.DiyTemplateOverride.find().lean()]);
    const changed = new Map(overrides.map((item) => [item.templateId, item.template]));
    res.json({ success: true, templates: templates.map((template) => changed.get(template.id) || template) });
})));
router.put('/:id', auth_middileware_1.default, (0, auth_middileware_1.authorizeRoles)('admin', 'sysadmin', 'boss', 'designer'), (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const template = (_a = req.body) === null || _a === void 0 ? void 0 : _a.template;
    if (!template || typeof template !== 'object' || String(template.id) !== String(req.params.id)) {
        res.status(400).json({ success: false, message: 'A valid template payload is required.' });
        return;
    }
    yield DiyTemplateOverride_1.DiyTemplateOverride.findOneAndUpdate({ templateId: req.params.id }, { templateId: req.params.id, template, updatedBy: req.userId }, { upsert: true, new: true, setDefaultsOnInsert: true });
    cached = null;
    res.json({ success: true, template });
})));
exports.default = router;
