import { config } from "../config/index.ts";
import { delay } from "../utils/delay.ts";

const MAX_RETRIES = 3;
const BASE_RETRY_DELAY_MS = 500;

function parseRetryAfter(responseBody: string): number | null {
  try {
    const parsed = JSON.parse(responseBody);
    const retryAfter = parsed?.parameters?.retry_after;
    return typeof retryAfter === "number" ? retryAfter : null;
  } catch {
    return null;
  }
}

export async function sendTelegramAlert(message: string): Promise<void> {
  const token = config.telegram.botToken;
  const chatId = config.telegram.chatId;
  if (!token || !chatId) throw new Error("Telegram env vars not set");

  const url = `https://api.telegram.org/bot${token}/sendMessage`;

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chatId, text: message }),
      });

      if (res.ok) {
        return;
      }

      const responseBody = await res.text();
      const retryAfter = res.status === 429 ? parseRetryAfter(responseBody) : null;

      lastError = new Error(
        `Telegram send failed with status ${res.status}: ${responseBody || "No response body"}`,
      );

      if (attempt < MAX_RETRIES) {
        const waitMs = (retryAfter ?? 0) * 1000 + BASE_RETRY_DELAY_MS;
        await delay(waitMs);
      }
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < MAX_RETRIES) {
        await delay(BASE_RETRY_DELAY_MS);
      }
    }
  }

  throw new Error(`Telegram send failed after ${MAX_RETRIES} attempts: ${lastError?.message}`);
}
