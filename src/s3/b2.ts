import { S3Client } from "@aws-sdk/client-s3";
import { config } from "../config/index.ts";

let client: S3Client | null = null;

export function getB2Client(): S3Client {
  if (!client) {
    client = new S3Client({
      endpoint: config.backblaze.endpoint,
      region: config.backblaze.region,
      credentials: {
        accessKeyId: config.backblaze.keyId,
        secretAccessKey: config.backblaze.appKey,
      },
    });
  }

  return client;
}
