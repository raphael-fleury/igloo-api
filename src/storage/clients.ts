function getBucketClient(bucket: string) {
  return new Bun.S3Client({
    accessKeyId: "admin",
    secretAccessKey: "password",
    region: "us-east-1",
    endpoint: "http://localhost:9000",
    bucket
  });
}

export const publicBucket = getBucketClient("public");
export const privateBucket = getBucketClient("private");