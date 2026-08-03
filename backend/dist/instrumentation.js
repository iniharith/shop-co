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
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.sanitizeSensitiveText = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const Sentry = __importStar(require("@sentry/node"));
dotenv_1.default.config();
const sensitiveKeys = /^(authorization|cookie|set-cookie|body|data|query|query_string|email|phone|name|address|customer|user)$/i;
const urlWithQuery = /((?:https?:\/\/|\/)[^\s"'<>?]+)\?[^\s"'<>]*/gi;
const secretAssignment = /((?:api[_-]?key|access[_-]?token|refresh[_-]?token|token|password|secret|session(?:id)?|cookie)\s*[:=]\s*)[^\s,;}"']+/gi;
const sanitizeSensitiveText = (value) => value
    .replace(urlWithQuery, '$1?[REDACTED]')
    .replace(/(bearer\s+)[A-Za-z0-9._~+/=-]+/gi, '$1[REDACTED]')
    .replace(secretAssignment, '$1[REDACTED]')
    .replace(/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/g, '[REDACTED_EMAIL]');
exports.sanitizeSensitiveText = sanitizeSensitiveText;
const sanitizeValue = (value) => {
    if (typeof value === 'string')
        return (0, exports.sanitizeSensitiveText)(value);
    if (Array.isArray(value))
        return value.map(sanitizeValue);
    if (!value || typeof value !== 'object')
        return value;
    return Object.fromEntries(Object.entries(value).flatMap(([key, entry]) => sensitiveKeys.test(key) ? [] : [[key, sanitizeValue(entry)]]));
};
const dsn = process.env.SENTRY_DSN;
if (dsn) {
    const configuredSampleRate = Number((_a = process.env.SENTRY_TRACES_SAMPLE_RATE) !== null && _a !== void 0 ? _a : '0.05');
    const tracesSampleRate = Number.isFinite(configuredSampleRate)
        ? Math.min(1, Math.max(0, configuredSampleRate))
        : 0.05;
    Sentry.init({
        dsn,
        environment: process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV,
        release: process.env.SENTRY_RELEASE,
        tracesSampleRate,
        sendDefaultPii: false,
        beforeSend(event) {
            var _a, _b;
            if (event.request) {
                event.request.data = undefined;
                event.request.query_string = undefined;
                event.request.cookies = undefined;
                if (event.request.url)
                    event.request.url = (0, exports.sanitizeSensitiveText)(event.request.url);
                if (event.request.headers) {
                    event.request.headers = Object.fromEntries(Object.entries(event.request.headers).filter(([key]) => !/^(authorization|cookie|set-cookie)$/i.test(key)));
                }
            }
            event.user = undefined;
            event.extra = sanitizeValue(event.extra);
            event.contexts = sanitizeValue(event.contexts);
            event.tags = sanitizeValue(event.tags);
            event.breadcrumbs = sanitizeValue(event.breadcrumbs);
            if (event.message)
                event.message = (0, exports.sanitizeSensitiveText)(event.message);
            if ((_a = event.exception) === null || _a === void 0 ? void 0 : _a.values) {
                for (const exception of event.exception.values) {
                    if (exception.value)
                        exception.value = (0, exports.sanitizeSensitiveText)(exception.value);
                    if ((_b = exception.stacktrace) === null || _b === void 0 ? void 0 : _b.frames) {
                        for (const frame of exception.stacktrace.frames) {
                            if (frame.filename)
                                frame.filename = (0, exports.sanitizeSensitiveText)(frame.filename);
                        }
                    }
                }
            }
            return event;
        },
    });
}
