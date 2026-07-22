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
const EasyParcelService_1 = require("../../infrastructure/services/EasyParcelService");
const auth_middileware_1 = __importStar(require("../middlewares/auth.middileware"));
const router = (0, express_1.Router)();
router.get('/callback', (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const adminAppUrl = (((_a = process.env.ADMIN_APP_URL) === null || _a === void 0 ? void 0 : _a.trim()) || 'https://admin.kampungcetak.com').replace(/\/$/, '');
    try {
        const code = typeof req.query.code === 'string' ? req.query.code : '';
        const state = typeof req.query.state === 'string' ? req.query.state : '';
        yield EasyParcelService_1.easyParcelService.handleAuthorizationCallback(code, state);
        res.redirect(`${adminAppUrl}/admin/orders?easyparcel=connected`);
    }
    catch (_error) {
        res.redirect(`${adminAppUrl}/admin/orders?easyparcel=error`);
    }
})));
router.get('/status', auth_middileware_1.default, (0, auth_middileware_1.authorizeRoles)('admin', 'sysadmin', 'boss', 'production', 'packaging'), (0, express_async_handler_1.default)((_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    res.json(yield EasyParcelService_1.easyParcelService.getConnectionStatus());
})));
router.post('/connect', auth_middileware_1.default, (0, auth_middileware_1.authorizeRoles)('admin', 'sysadmin', 'boss'), (0, express_async_handler_1.default)((_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    res.json({ authorizationUrl: yield EasyParcelService_1.easyParcelService.createAuthorizationUrl() });
})));
exports.default = router;
