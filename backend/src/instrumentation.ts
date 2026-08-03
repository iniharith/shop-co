import dotenv from 'dotenv';
import * as Sentry from '@sentry/node';

dotenv.config();

const sensitiveKeys = /^(authorization|cookie|set-cookie|body|data|query|query_string|email|phone|name|address|customer|user)$/i;
const urlWithQuery = /((?:https?:\/\/|\/)[^\s"'<>?]+)\?[^\s"'<>]*/gi;
const secretAssignment = /((?:api[_-]?key|access[_-]?token|refresh[_-]?token|token|password|secret|session(?:id)?|cookie)\s*[:=]\s*)[^\s,;}"']+/gi;

export const sanitizeSensitiveText = (value: string): string =>
    value
        .replace(urlWithQuery, '$1?[REDACTED]')
        .replace(/(bearer\s+)[A-Za-z0-9._~+/=-]+/gi, '$1[REDACTED]')
        .replace(secretAssignment, '$1[REDACTED]')
        .replace(/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/g, '[REDACTED_EMAIL]');

const sanitizeValue = (value: unknown): unknown => {
    if (typeof value === 'string') return sanitizeSensitiveText(value);
    if (Array.isArray(value)) return value.map(sanitizeValue);
    if (!value || typeof value !== 'object') return value;

    return Object.fromEntries(
        Object.entries(value).flatMap(([key, entry]) =>
            sensitiveKeys.test(key) ? [] : [[key, sanitizeValue(entry)]],
        ),
    );
};

const dsn = process.env.SENTRY_DSN;

if (dsn) {
    const configuredSampleRate = Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? '0.05');
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
            if (event.request) {
                event.request.data = undefined;
                event.request.query_string = undefined;
                event.request.cookies = undefined;
                if (event.request.url) event.request.url = sanitizeSensitiveText(event.request.url);
                if (event.request.headers) {
                    event.request.headers = Object.fromEntries(
                        Object.entries(event.request.headers).filter(
                            ([key]) => !/^(authorization|cookie|set-cookie)$/i.test(key),
                        ),
                    );
                }
            }

            event.user = undefined;
            event.extra = sanitizeValue(event.extra) as typeof event.extra;
            event.contexts = sanitizeValue(event.contexts) as typeof event.contexts;
            event.tags = sanitizeValue(event.tags) as typeof event.tags;
            event.breadcrumbs = sanitizeValue(event.breadcrumbs) as typeof event.breadcrumbs;
            if (event.message) event.message = sanitizeSensitiveText(event.message);
            if (event.exception?.values) {
                for (const exception of event.exception.values) {
                    if (exception.value) exception.value = sanitizeSensitiveText(exception.value);
                    if (exception.stacktrace?.frames) {
                        for (const frame of exception.stacktrace.frames) {
                            if (frame.filename) frame.filename = sanitizeSensitiveText(frame.filename);
                        }
                    }
                }
            }

            return event;
        },
    });
}
