import "dotenv/config";
import { test, expect } from "vitest";
import { uploadCsvToB2 } from "../../upload/upload-b2.ts";

test("uploads a CSV file to Backblaze B2", async () => {
  try {
    const fileName = `products/2026-08-05/node-test-${Date.now()}.csv`;
    const csv = "sku,price\nABC-1,99\n";

    const result = await uploadCsvToB2(csv, fileName);

    expect(result.$metadata.httpStatusCode).toBe(200);
  } catch (error) {
    console.error("Caught hidden error:", error);
    throw error;
  }
});
