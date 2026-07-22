import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://dummy@sentry.io/123",
  tracesSampleRate: 1,
  debug: false,
});
