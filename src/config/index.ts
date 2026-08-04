export const config = {
  mongodb: {
    uri: process.env.MONGODB_URI ?? "",
    dbName: process.env.DB_NAME ?? "price_tracker",
  },
  telegram: {
    botToken: process.env.TELEGRAM_BOT_TOKEN ?? "",
    chatId: process.env.TELEGRAM_CHAT_ID ?? "",
  },
  backblaze: {
    endpoint: process.env.B2_ENDPOINT ?? "",
    keyId: process.env.B2_KEY_ID ?? "",
    appKey: process.env.B2_APP_KEY ?? "",
    bucketName: process.env.B2_BUCKET_NAME ?? "",
  },
} as const;