import "dotenv/config";
import { test, expect } from "vitest";

test("sends a real Telegram message as an optional smoke test when credentials are available", async () => {
  const { sendTelegramAlert } = await import("../notify/telegram.ts");

  await expect(
    sendTelegramAlert("Test smoke message from local setup"),
  ).resolves.toBeUndefined();
});
