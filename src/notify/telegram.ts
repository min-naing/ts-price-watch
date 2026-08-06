import { getConfig } from "../config/index.ts";
import { withRetry } from "../utils/retry.ts";

const BASE_RETRY_DELAY_MS = 500;

/**
 * Thrown when Telegram responds with 429 so that withRetry can
 * honour the server-supplied retry_after instead of the default backoff.
 */
export class TelegramRateLimitError extends Error {
  constructor(public readonly retryAfterMs: number) {
    super(`Rate limited, retry after ${retryAfterMs}ms`);
    this.name = "TelegramRateLimitError";
  }
}

function parseRetryAfterMs(responseBody: string): number | null {
  try {
    const parsed = JSON.parse(responseBody);
    const retryAfter = parsed?.parameters?.retry_after;
    return typeof retryAfter === "number" ? retryAfter * 1000 : null;
  } catch {
    return null;
  }
}

export async function sendTelegramAlert(message: string): Promise<void> {
  const config = getConfig();
  const { botToken: token, chatId } = config.telegram;
  const { maxRetries } = config.scraper;

  if (!token || !chatId) throw new Error("Telegram env vars not set");

  const url = `https://api.telegram.org/bot${token}/sendMessage`;

  try {
    await withRetry(
      async () => {
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chat_id: chatId, text: message }),
        });

        if (res.ok) return;

        const responseBody = await res.text();

        if (res.status === 429) {
          const retryAfterMs = parseRetryAfterMs(responseBody);
          if (retryAfterMs !== null) {
            throw new TelegramRateLimitError(retryAfterMs);
          }
        }

        throw new Error(
          `Telegram send failed with status ${res.status}: ${responseBody || "No response body"}`,
        );
      },
      {
        maxRetries,
        baseDelayMs: BASE_RETRY_DELAY_MS,
        getDelayMs: (attempt, error) => {
          if (error instanceof TelegramRateLimitError) {
            return error.retryAfterMs + BASE_RETRY_DELAY_MS;
          }
          return BASE_RETRY_DELAY_MS * Math.pow(2, attempt - 1);
        },
      },
    );
  } catch (error) {
    // Wrap with Telegram-specific context, preserving the original message
    throw new Error(
      `Telegram send failed after ${maxRetries} attempts: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}