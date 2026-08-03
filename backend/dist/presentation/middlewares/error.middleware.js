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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = exports.notFound = void 0;
const api_constant_1 = require("../../shared/constants/api.constant");
const Sentry = __importStar(require("@sentry/node"));
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
const instrumentation_1 = require("../../instrumentation");
const notFound = (req, res, next) => {
    const error = new Error(`${api_constant_1.messages.NOT_FOUND} - ${req.path}`);
    res.status(api_constant_1.statusCodes.NOT_FOUND);
    next(error);
};
exports.notFound = notFound;
const errorHandler = (err, req, res, _next) => {
    let statusCode = res.statusCode == api_constant_1.statusCodes.OK ? api_constant_1.statusCodes.INTERNAL_SERVER_ERROR : res.statusCode;
    let message = err.message;
    if (err.name === "CastError" && err.kind === "ObjectId") {
        statusCode = api_constant_1.statusCodes.NOT_FOUND;
        message = api_constant_1.messages.NOT_FOUND;
    }
    const safeError = {
        timestamp: new Date().toISOString(),
        requestId: req.requestId,
        method: req.method,
        path: req.path,
        statusCode,
        error: (0, instrumentation_1.sanitizeSensitiveText)(err.name),
        message: (0, instrumentation_1.sanitizeSensitiveText)(message),
        stack: err.stack ? (0, instrumentation_1.sanitizeSensitiveText)(err.stack) : undefined,
    };
    console.error(JSON.stringify(safeError));
    void fs_1.promises.appendFile(path_1.default.join(process.cwd(), 'error.log'), `${JSON.stringify(safeError)}\n`).catch((writeError) => {
        console.error(JSON.stringify({
            requestId: req.requestId,
            error: 'error_log_write_failed',
            message: (0, instrumentation_1.sanitizeSensitiveText)(writeError instanceof Error ? writeError.message : String(writeError)),
        }));
    });
    if (statusCode >= 500) {
        Sentry.withScope((scope) => {
            scope.setTags({
                requestId: req.requestId,
                method: req.method,
                path: req.path,
            });
            Sentry.captureException(err);
        });
    }
    const responseMessage = process.env.NODE_ENV === 'production' && statusCode >= 500
        ? 'Internal server error'
        : message;
    res.status(statusCode).json({
        message: responseMessage,
        requestId: req.requestId,
        stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    });
};
exports.errorHandler = errorHandler;
