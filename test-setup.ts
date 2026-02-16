import { appDataSource } from "@/database/data-source";
import { beforeAll, afterAll } from "bun:test";

process.env.NODE_ENV = "test";
process.env.POSTGRES_HOST = "localhost";
process.env.POSTGRES_PORT = "5436";
process.env.POSTGRES_DB = "igloo_test_db";
process.env.POSTGRES_USER = "postgres";
process.env.POSTGRES_PASSWORD = "12345678";

beforeAll(async () => {
  await appDataSource.initialize();
});

afterAll(async () => {
  await appDataSource.destroy();
});
