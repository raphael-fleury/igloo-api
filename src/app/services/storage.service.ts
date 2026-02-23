import { randomUUIDv7 } from "bun";
import { privateBucket, publicBucket } from "@/storage/clients";

export class StorageService {
    private readonly bucket: Bun.S3Client;

    constructor({ isPublic }: { isPublic: boolean }) {
        this.bucket = isPublic ? publicBucket : privateBucket;
    }

    async uploadFile(path: string, file: Blob) {
        await this.bucket.write(path, file);
    }

    async deleteFile(path: string) {
        await this.bucket.delete(path);
    }

    generateFileUrl(folder: string, file: Blob) {
        const extension = file.type.split('/')[1];
        const filename = `${randomUUIDv7()}.${extension}`;
        return `${folder}/${filename}`;
    }
}