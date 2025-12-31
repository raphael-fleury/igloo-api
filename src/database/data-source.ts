import "reflect-metadata";
import { DataSource } from "typeorm";
import { env } from "../env";
import { SnakeNamingStrategy } from "typeorm-naming-strategies";

export const appDataSource = new DataSource({
    type: "postgres",
    host: env.POSTGRES_HOST,
    port: env.POSTGRES_PORT,
    database: env.POSTGRES_DB,
    username: env.POSTGRES_USER,
    password: env.POSTGRES_PASSWORD,
    entities: ["src/database/entities/*.ts"],
    synchronize: true,
    logging: true,
    namingStrategy: new SnakeNamingStrategy() 
});
