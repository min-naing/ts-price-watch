function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

function optionalEnv(name: string, defaultValue: string): string {
  return process.env[name]?.trim() || defaultValue;
}

// ── section loaders (used by services and smoke tests) ──────────────

export function loadTelegramConfig() {
  return {
    botToken: requireEnv("TELEGRAM_BOT_TOKEN"),
    chatId:   requireEnv("TELEGRAM_CHAT_ID"),
  };
}

export function loadMongoConfig() {
  return {
    uri: requireEnv("MONGODB_URI"),
  };
}

export function loadBackblazeConfig() {
  return {
    region:     requireEnv("B2_REGION"),
    endpoint:   requireEnv("B2_ENDPOINT"),
    keyId:      requireEnv("B2_KEY_ID"),
    appKey:     requireEnv("B2_APP_KEY"),
    bucketName: requireEnv("B2_BUCKET_NAME"),
  };
}

// ── full config (used by index.ts at startup) ────────────────────────
type AppConfig = {
  mongodb:   ReturnType<typeof loadMongoConfig>;
  telegram:  ReturnType<typeof loadTelegramConfig>;
  backblaze: ReturnType<typeof loadBackblazeConfig>;
  scraper: {
    timeoutMs:  number;
    maxRetries: number;
    batchDelayMs: number;
    failRateThereshold: number;
  };
}

let _config: AppConfig | null = null;

export function loadConfig(): AppConfig {
  if (_config) return _config;

  // calls every section loader — guarantees ALL required vars
  // are validated at startup, one clear crash if anything is missing
  _config = {
    mongodb:   loadMongoConfig(),
    telegram:  loadTelegramConfig(),
    backblaze: loadBackblazeConfig(),
    scraper: {
      timeoutMs:  parseInt(optionalEnv("SCRAPER_TIMEOUT_MS",  "30000"), 10),
      maxRetries: parseInt(optionalEnv("SCRAPER_MAX_RETRIES", "3"), 10),
      batchDelayMs: parseInt(optionalEnv("SCRAPER_BATCH_DELAY_MS", "1300"), 10),
      failRateThereshold: parseFloat(optionalEnv("SCRAPER_FAILED_RATE_THERESHOLD", "0.3"))
    },
  };

  return _config;
}

export function getConfig(): AppConfig {
  return _config ?? loadConfig();
}

export function resetConfig(): void {
  _config = null;
}