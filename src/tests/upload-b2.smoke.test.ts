import "dotenv/config";
import { test, expect } from "vitest";
import { HeadObjectCommand } from "@aws-sdk/client-s3";

import { uploadCsvToB2 } from "../upload/upload-b2.ts";
import { getB2Client } from "../s3/b2.ts";
import { config } from "../config/index.ts";

test("uploads a CSV file to Backblaze B2", async () => {

  const fileName = `products/2026-08-05/node-test-${Date.now()}.csv`;
  const csv = "sku,price\nABC-1,99\n";

  await uploadCsvToB2(csv, fileName);

  const client = getB2Client();
  const result = await client.send(
    new HeadObjectCommand({
      Bucket: config.backblaze.bucketName,
      Key: fileName,
    }),
  );

  expect(result.$metadata.httpStatusCode).toBe(200);
});