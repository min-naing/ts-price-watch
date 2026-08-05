// Fake env vars for all unit tests.
// Real values are only needed for smoke tests (which load dotenv themselves).
process.env.MONGODB_URI        = "mongodb://localhost:27017";
process.env.B2_REGION          = "us-east-1";
process.env.B2_ENDPOINT        = "https://example.com";
process.env.B2_KEY_ID          = "test-key";
process.env.B2_APP_KEY         = "test-secret";
process.env.B2_BUCKET_NAME     = "test-bucket";
process.env.TELEGRAM_BOT_TOKEN = "test-token";
process.env.TELEGRAM_CHAT_ID   = "123456";