import "dotenv/config";
import { test, expect } from "vitest";
import { loadTelegramConfig } from "../../config/index.ts";

test("sends a real Telegram message as an optional smoke test when credentials are available", async () => {
  loadTelegramConfig();
  const { sendTelegramAlert } = await import("../../notify/telegram.ts");

  await expect(
    sendTelegramAlert("Test smoke message from local setup"),
  ).resolves.toBeUndefined();
});
