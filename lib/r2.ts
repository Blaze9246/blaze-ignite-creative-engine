import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
export function r2Client() {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  if (!accountId || !accessKeyId || !secretAccessKey) throw new Error("R2 env vars missing");
  return new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey }
  });
}
export async function uploadToR2(key: string, bytes: Uint8Array, contentType: string) {
  const bucket = process.env.R2_BUCKET;
  const baseUrl = process.env.R2_PUBLIC_BASE_URL;
  if (!bucket || !baseUrl) throw new Error("R2_BUCKET / R2_PUBLIC_BASE_URL missing");
  const client = r2Client();
  await client.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: bytes, ContentType: contentType }));
  return `${baseUrl.replace(/\/$/, "")}/${key}`;
}
