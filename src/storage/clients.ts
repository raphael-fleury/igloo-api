import { env } from "@/env";

function getBucketClient(bucket: string) {
  return new Bun.S3Client({
    accessKeyId: env.MINIO_ROOT_USER,
    secretAccessKey: env.MINIO_ROOT_PASSWORD,
    endpoint: env.MINIO_URL,
    bucket
  });
}

export const publicBucket = getBucketClient("public");
export const privateBucket = getBucketClient("private");