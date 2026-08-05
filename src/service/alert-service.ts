import { sendTelegramAlert } from "../notify/telegram.ts";
import { delay } from "../utils/delay.ts";

const BATCH_SIZE = 5;
const BATCH_DELAY_MS = 1300;

export async function sendPriceDropAlertsInBatches(
  alerts: string[],
  batchSize: number = BATCH_SIZE,
): Promise<void> {
  for (let index = 0; index < alerts.length; index += batchSize) {
    const batch = alerts.slice(index, index + batchSize);
    const message = batch.join("\n\n");
    await sendTelegramAlert(message);

    if (index + batchSize < alerts.length) {
      await delay(BATCH_DELAY_MS);
    }
  }
}