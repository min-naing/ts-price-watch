import { getConfig } from "../config/index.ts";
import { sendTelegramAlert } from "../notify/telegram.ts";
import { delay } from "../utils/delay.ts";

const MAX_ALERTS_PER_MESSAGE = 5;
const MAX_TELEGRAM_MESSAGE_LENGTH = 4096;
const ALERT_SEPARATOR = "\n\n";

function buildAlertMessages(
  alerts: string[],
  batchSize: number,
): string[] {
  if (!Number.isInteger(batchSize) || batchSize < 1) {
    throw new RangeError("batchSize must be a positive integer");
  }

  const messages: string[] = [];
  let currentAlertsCount = 0;
  let currentMessage = "";

  for (const alert of alerts) {
    if (alert.length > MAX_TELEGRAM_MESSAGE_LENGTH) {
      throw new RangeError("A single alert exceeds Telegram message length limit");
    }

    const nextMessage = currentMessage
      ? `${currentMessage}${ALERT_SEPARATOR}${alert}`
      : alert;
    const wouldExceedBatchSize = currentAlertsCount >= batchSize;
    const wouldExceedMessageLength =
      nextMessage.length > MAX_TELEGRAM_MESSAGE_LENGTH;

    if (currentMessage && (wouldExceedBatchSize || wouldExceedMessageLength)) {
      messages.push(currentMessage);
      currentMessage = alert;
      currentAlertsCount = 1;
    } else {
      currentMessage = nextMessage;
      currentAlertsCount += 1;
    }
  }

  if (currentMessage) {
    messages.push(currentMessage);
  }

  return messages;
}

const BATCH_DELAY_MS = 1000;

export async function sendPriceDropAlertsInBatches(
  alerts: string[],
  batchSize: number = MAX_ALERTS_PER_MESSAGE,
): Promise<void> {
  const messages = buildAlertMessages(alerts, batchSize);

  for (let index = 0; index < messages.length; index += 1) {
    try {
      await sendTelegramAlert(messages[index]!);

      if (index + 1 < messages.length) {
        await delay(BATCH_DELAY_MS);
      }
    } catch (err) {
      console.error("Failed to send telegram alert in batch:", err);
    }
    
  }
}
