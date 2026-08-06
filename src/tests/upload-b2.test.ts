import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock the B2 client — we test retry behaviour, not the AWS SDK itself
const sendMock = vi.fn();
vi.mock("../s3/b2.ts", () => ({
  getB2Client: () => ({ send: sendMock }),
}));

// Avoid real delays in unit tests
vi.mock("../utils/delay.ts", () => ({
  delay: vi.fn().mockResolvedValue(undefined),
}));

import { uploadCsvToB2 } from "../upload/upload-b2.ts";
import { delay } from "../utils/delay.ts";

describe("uploadCsvToB2", () => {
  beforeEach(() => {
    sendMock.mockReset();
    vi.mocked(delay).mockResolvedValue(undefined);
  });

  it("uploads successfully on the first attempt", async () => {
    sendMock.mockResolvedValue({});

    await expect(
      uploadCsvToB2("name,price\nWidget,10\n", "products/2026-08-07/test.csv"),
    ).resolves.toBeUndefined();

    expect(sendMock).toHaveBeenCalledTimes(1);
    expect(delay).not.toHaveBeenCalled();
  });

  it("retries once after a transient failure and succeeds", async () => {
    sendMock
      .mockRejectedValueOnce(new Error("Network error"))
      .mockResolvedValue({});

    await expect(
      uploadCsvToB2("name,price\nWidget,10\n", "products/2026-08-07/test.csv"),
    ).resolves.toBeUndefined();

    expect(sendMock).toHaveBeenCalledTimes(2);
    expect(delay).toHaveBeenCalledTimes(1);
  });

  it("throws a clear error after all retries are exhausted", async () => {
    sendMock.mockRejectedValue(new Error("B2 unreachable"));

    await expect(
      uploadCsvToB2("name,price\nWidget,10\n", "products/2026-08-07/test.csv"),
    ).rejects.toThrow("B2 upload failed after 3 attempts: B2 unreachable");

    expect(sendMock).toHaveBeenCalledTimes(3);
  });

  it("logs a warning on each failed attempt before retrying", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    sendMock
      .mockRejectedValueOnce(new Error("timeout"))
      .mockResolvedValue({});

    await uploadCsvToB2("name,price\n", "test.csv");

    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("attempt 1 failed"),
      "timeout",
    );

    warnSpy.mockRestore();
  });
});