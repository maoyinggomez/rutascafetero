import postgres from "postgres";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL no está configurada");
  process.exit(1);
}

async function runMigration() {
  const client = postgres(DATABASE_URL);
  
  try {
    console.log("🔄 Ejecutando migración...");
    
    // Crear enum para estados de rutas
    await client`
      DO $$ BEGIN
        CREATE TYPE estado_ruta AS ENUM ('BORRADOR', 'PUBLICADA', 'OCULTA', 'ELIMINADA');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `;
    console.log("✓ Enum estado_ruta creado o ya existe");

    // Agregar columna estado a la tabla rutas
    await client`
      ALTER TABLE rutas
      ADD COLUMN IF NOT EXISTS estado estado_ruta NOT NULL DEFAULT 'BORRADOR';
    `;
    console.log("✓ Columna estado agregada a rutas");

    console.log("✅ Migración completada exitosamente");
  } catch (error) {
    console.error("❌ Error en la migración:", error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();
