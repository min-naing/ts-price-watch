function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const config = {
  mongodb: {
    uri: requireEnv("MONGODB_URI"),
  },
  telegram: {
    botToken: requireEnv("TELEGRAM_BOT_TOKEN"),
    chatId: requireEnv("TELEGRAM_CHAT_ID"),
  },
  backblaze: {
    region: requireEnv("B2_REGION"),
    endpoint: requireEnv("B2_ENDPOINT"),
    keyId: requireEnv("B2_KEY_ID"),
    appKey: requireEnv("B2_APP_KEY"),
    bucketName: requireEnv("B2_BUCKET_NAME"),
  },
} as const;