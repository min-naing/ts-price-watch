import { PutObjectCommand } from "@aws-sdk/client-s3";
import { config } from "../config/index.ts";
import { getB2Client } from "../s3/b2.ts";

export async function uploadCsvToB2(csvContent: string, fileName: string): Promise<void> {
    const client = getB2Client();

    const command = new PutObjectCommand({
        Bucket: config.backblaze.bucketName,
        Key: fileName,
        Body: csvContent,
        ContentType: "text/csv"
    });

    await client.send(command);
    console.log(`✅ Uploaded: ${fileName}`);
}
