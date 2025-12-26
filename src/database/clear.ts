import "reflect-metadata"
import { appDataSource } from "./data-source"

async function clear() {
    console.log("🧹 Limpando banco...")

    await appDataSource.initialize()

    const entities = appDataSource.entityMetadatas

    for (const entity of entities) {
        const repository = appDataSource.getRepository(entity.name)

        const tableName = entity.tableName

        await repository.query(
            `TRUNCATE TABLE "${tableName}" RESTART IDENTITY CASCADE;`
        )
    }

    await appDataSource.destroy()

    console.log("✅ Banco limpo com sucesso")
}

clear().catch(async err => {
    console.error("❌ Erro ao limpar banco:", err)
    try { await appDataSource.destroy() } catch {}
    process.exit(1)
})
