import {
  defineRailway,
  github,
  postgres,
  preserve,
  project,
  service,
  volume,
} from "railway/iac";

export default defineRailway(() => {
  const Postgres = postgres("Postgres", {
    region: "europe-west4-drams3a",
  });

  Postgres.networking = {
    privateNetworkEndpoint: "postgres",
  };

  const postgresVolume = volume("postgres-volume", {
    alerts: {
      usage: {
        "100": {},
        "80": {},
        "95": {},
      },
    },
    allowOnlineResize: true,
    region: "europe-west4-drams3a",
    sizeMB: 5000,
  });

  const websocketServer = service("websocket-server", {
    source: github("mobby57/memoLib", {
      checkSuites: false,
      rootDirectory: "/websocket-server",
    }),
    replicas: {
      "europe-west4-drams3a": 1,
    },
  });

  const memolib = service("memolib", {
    source: github("mobby57/memoLib", {
      checkSuites: true,
    }),
    replicas: {
      "europe-west4-drams3a": 1,
    },
    deploy: {
      ipv6EgressEnabled: true,
    },
    domains: ["memolib.space"],
    env: {
      BYPASS_REGION_CHECK: preserve(),
      CLERK_SECRET_KEY: preserve(),
      CRON_SECRET: preserve(),
      DATABASE_URL: preserve(),
      ENCRYPTION_MASTER_KEY: preserve(),
      GOOGLE_CLIENT_ID: preserve(),
      GOOGLE_CLIENT_SECRET: preserve(),
      IMAP_HOST: preserve(),
      IMAP_PASSWORD: preserve(),
      IMAP_PORT: preserve(),
      IMAP_TLS: preserve(),
      IMAP_USER: preserve(),
      INTAKE_WEBHOOK_SECRET: preserve(),
      NEXTAUTH_SECRET: preserve(),
      NEXTAUTH_URL: preserve(),
      NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: preserve(),
      NEXT_PUBLIC_SENTRY_DSN: preserve(),
      NEXT_PUBLIC_WS_URL: preserve(),
      PISTE_ENVIRONMENT: preserve(),
      PISTE_PROD_API_URL: preserve(),
      PISTE_PROD_CLIENT_ID: preserve(),
      PISTE_PROD_CLIENT_SECRET: preserve(),
      PISTE_PROD_OAUTH_URL: preserve(),
      RESEND_API_KEY: preserve(),
      RESEND_WEBHOOK_SECRET: preserve(),
      SENTRY_DSN: preserve(),
      UPSTASH_REDIS_REST_TOKEN: preserve(),
      UPSTASH_REDIS_REST_URL: preserve(),
      WS_EMIT_SECRET: preserve(),
    },
  });

  return project("memolib", {
    resources: [
      websocketServer,
      Postgres,
      memolib,
      postgresVolume,
    ],
  });
});
