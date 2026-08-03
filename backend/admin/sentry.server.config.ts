import * as Sentry from "@sentry/nextjs";
import { sentryOptions } from "./sentry.config-utils";

if (sentryOptions.dsn) {
  Sentry.init(sentryOptions);
}
