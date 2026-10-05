import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock the B2 client — we test upload and retry behaviour,
// not the AWS SDK itself.
const sendMock = vi.fn();

vi.mock("../s3/b2.ts", () => ({
  getB2Client: () => ({ send: sendMock }),
}));

// Mock configuration so the unit test does not depend on
// environment variables or the default configuration.
vi.mock("../config/index.ts", () => ({
  getConfig: vi.fn(() => ({
    scraper: {
      maxRetries: 3,
    },
    backblaze: {
      bucketName: "test-bucket",
    },
  })),
}));

// Avoid real delays in unit tests.
vi.mock("../utils/delay.ts", () => ({
  delay: vi.fn().mockResolvedValue(undefined),
}));

import { uploadCsvToB2 } from "../upload/upload-b2.ts";
import { delay } from "../utils/delay.ts";

const successResponse = {
  $metadata: {
    httpStatusCode: 200,
  },
};

describe("uploadCsvToB2", () => {
  beforeEach(() => {
    sendMock.mockReset();

    vi.mocked(delay).mockReset();
    vi.mocked(delay).mockResolvedValue(undefined);
  });

  it("uploads successfully on the first attempt", async () => {
    sendMock.mockResolvedValue(successResponse);

    const result = await uploadCsvToB2(
      "name,price\nWidget,10\n",
      "products/2026-08-07/test.csv",
    );

    expect(result.$metadata.httpStatusCode).toBe(200);
    expect(sendMock).toHaveBeenCalledTimes(1);
    expect(delay).not.toHaveBeenCalled();
  });

  it("retries once after a transient failure and succeeds", async () => {
    sendMock
      .mockRejectedValueOnce(new Error("Network error"))
      .mockResolvedValue(successResponse);

    const result = await uploadCsvToB2(
      "name,price\nWidget,10\n",
      "products/2026-08-07/test.csv",
    );

    expect(result.$metadata.httpStatusCode).toBe(200);
    expect(sendMock).toHaveBeenCalledTimes(2);
    expect(delay).toHaveBeenCalledTimes(1);
  });

  it("retries with exponential backoff", async () => {
    sendMock
      .mockRejectedValueOnce(new Error("Network error 1"))
      .mockRejectedValueOnce(new Error("Network error 2"))
      .mockResolvedValue(successResponse);

    const result = await uploadCsvToB2(
      "name,price\nWidget,10\n",
      "products/2026-08-07/test.csv",
    );

    expect(result.$metadata.httpStatusCode).toBe(200);
    expect(sendMock).toHaveBeenCalledTimes(3);

    expect(delay).toHaveBeenCalledTimes(2);
    expect(delay).toHaveBeenNthCalledWith(1, 1000);
    expect(delay).toHaveBeenNthCalledWith(2, 2000);
  });

  it("throws the original error after all attempts are exhausted", async () => {
    const error = new Error("B2 unreachable");

    sendMock.mockRejectedValue(error);

    await expect(
      uploadCsvToB2(
        "name,price\nWidget,10\n",
        "products/2026-08-07/test.csv",
      ),
    ).rejects.toThrow("B2 unreachable");

    expect(sendMock).toHaveBeenCalledTimes(3);
    expect(delay).toHaveBeenCalledTimes(2);
  });

  it("logs a warning before each retry", async () => {
    const warnSpy = vi
      .spyOn(console, "warn")
      .mockImplementation(() => undefined);

    sendMock
      .mockRejectedValueOnce(new Error("timeout"))
      .mockResolvedValue(successResponse);

    await uploadCsvToB2("name,price\n", "test.csv");

    expect(warnSpy).toHaveBeenCalledTimes(1);

    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("attempt 1 failed"),
      "timeout",
    );

    warnSpy.mockRestore();
  });

  it("logs an error when all upload attempts fail", async () => {
    const errorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    sendMock.mockRejectedValue(new Error("B2 unreachable"));

    await expect(
      uploadCsvToB2("name,price\n", "test.csv"),
    ).rejects.toThrow("B2 unreachable");

    expect(errorSpy).toHaveBeenCalledWith(
      "B2 upload failed after 3 attempts: B2 unreachable",
    );

    errorSpy.mockRestore();
  });
});