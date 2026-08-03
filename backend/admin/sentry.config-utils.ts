const sensitiveKeys = /^(authorization|cookie|set-cookie|body|data|query|query_string|email|phone|name|address|customer|user)$/i;
const urlWithQuery = /((?:https?:\/\/|\/)[^\s"'<>?]+)\?[^\s"'<>]*/gi;
const secretAssignment = /((?:api[_-]?key|access[_-]?token|refresh[_-]?token|token|password|secret|session(?:id)?|cookie)\s*[:=]\s*)[^\s,;}"']+/gi;

const sanitizeText = (value: string) => value
  .replace(urlWithQuery, "$1?[REDACTED]")
  .replace(/(bearer\s+)[A-Za-z0-9._~+/=-]+/gi, "$1[REDACTED]")
  .replace(secretAssignment, "$1[REDACTED]")
  .replace(/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/g, "[REDACTED_EMAIL]");

const sanitizeValue = (value: unknown): unknown => {
  if (typeof value === "string") return sanitizeText(value);
  if (Array.isArray(value)) return value.map(sanitizeValue);
  if (!value || typeof value !== "object") return value;

  return Object.fromEntries(
    Object.entries(value).flatMap(([key, entry]) =>
      sensitiveKeys.test(key) ? [] : [[key, sanitizeValue(entry)]]
    )
  );
};

const configuredSampleRate = Number(process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE ?? "0.05");

export const sentryOptions = {
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN,
  environment: process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT || process.env.NODE_ENV,
  release: process.env.NEXT_PUBLIC_SENTRY_RELEASE,
  tracesSampleRate: Number.isFinite(configuredSampleRate)
    ? Math.min(1, Math.max(0, configuredSampleRate))
    : 0.05,
  sendDefaultPii: false,
  beforeSend(event: any) {
    if (event.request) {
      event.request.data = undefined;
      event.request.query_string = undefined;
      event.request.cookies = undefined;
      if (event.request.url) event.request.url = sanitizeText(event.request.url);
      if (event.request.headers) {
        event.request.headers = Object.fromEntries(
          Object.entries(event.request.headers).filter(
            ([key]) => !/^(authorization|cookie|set-cookie)$/i.test(key)
          )
        );
      }
    }

    event.user = undefined;
    event.extra = sanitizeValue(event.extra);
    event.contexts = sanitizeValue(event.contexts);
    event.tags = sanitizeValue(event.tags);
    event.breadcrumbs = sanitizeValue(event.breadcrumbs);
    if (event.message) event.message = sanitizeText(event.message);
    if (event.exception?.values) {
      for (const exception of event.exception.values) {
        if (exception.value) exception.value = sanitizeText(exception.value);
        if (exception.stacktrace?.frames) {
          for (const frame of exception.stacktrace.frames) {
            if (frame.filename) frame.filename = sanitizeText(frame.filename);
          }
        }
      }
    }
    return event;
  },
};
