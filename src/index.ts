import { appDataSource } from "./database/data-source";
import { app } from "./http";

try {
    await appDataSource.initialize();
    console.log("✅ Database connected successfully");
} catch (error) {
    console.error("❌ Database connection failed:", error);
}

app.listen(3000);

console.log(
    `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
