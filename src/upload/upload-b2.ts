import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getConfig } from "../config/index.ts";
import { getB2Client } from "../s3/b2.ts";
import { withRetry } from "../utils/retry.ts";

const BASE_RETRY_DELAY_MS = 1000;

export async function uploadCsvToB2(
  csvContent: string,
  fileName: string,
): Promise<void> {
  const client = getB2Client();
  const config = getConfig();
  const { maxRetries } = config.scraper;

  const command = new PutObjectCommand({
    Bucket: config.backblaze.bucketName,
    Key: fileName,
    Body: csvContent,
    ContentType: "text/csv",
  });

  try {
    await withRetry(() => client.send(command), {
      maxRetries,
      baseDelayMs: BASE_RETRY_DELAY_MS,
      onRetry: (attempt, error) => {
        console.warn(
          `B2 upload attempt ${attempt} failed, retrying…`,
          error instanceof Error ? error.message : error,
        );
      },
    });
  } catch (error) {
    throw new Error(
      `B2 upload failed after ${maxRetries} attempts: ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  console.log(`✅ Uploaded: ${fileName}`);
}