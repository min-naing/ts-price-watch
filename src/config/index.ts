import type { AppConfig } from "../types/app-config.ts";

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

function optionalEnv(name: string, defaultValue: string): string {
  return process.env[name]?.trim() || defaultValue;
}

let _config: AppConfig | null = null;

export function loadConfig(): AppConfig {
  if (_config) return _config;

  // All required vars are validated here, upfront.
  // If any are missing, the process crashes immediately with a clear message
  // before any scraping, DB connection, or network call happens.
  _config = {
    mongodb: {
      uri: requireEnv("MONGODB_URI"),
    },
    telegram: {
      botToken: requireEnv("TELEGRAM_BOT_TOKEN"),
      chatId:   requireEnv("TELEGRAM_CHAT_ID"),
    },
    backblaze: {
      region:     requireEnv("B2_REGION"),
      endpoint:   requireEnv("B2_ENDPOINT"),
      keyId:      requireEnv("B2_KEY_ID"),
      appKey:     requireEnv("B2_APP_KEY"),
      bucketName: requireEnv("B2_BUCKET_NAME"),
    },
    scraper: {
      timeoutMs:  parseInt(optionalEnv("SCRAPER_TIMEOUT_MS",  "30000")),
      maxRetries: parseInt(optionalEnv("SCRAPER_MAX_RETRIES", "3")),
    },
  };

  return _config;
}

// This is what services call. It auto-initializes if loadConfig() was
// never explicitly called — which is what makes tests work without
// needing a loadConfig() call in beforeEach.
export function getConfig(): AppConfig {
  return _config ?? loadConfig();
}

// Only needed in tests — lets each test start with a clean state
export function resetConfig(): void {
  _config = null;
}