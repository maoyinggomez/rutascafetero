import postgres from "postgres";
import * as dotenv from "dotenv";

dotenv.config();

const sql = postgres(process.env.DATABASE_URL || "");

async function migrateDatabase() {
  try {
    console.log("🔄 Iniciando migración de duracionHoras a duracionMinutos...");

    // 1. Crear columna temporal
    console.log("1. Creando columna temporal duracion_minutos_temp...");
    await sql`
      ALTER TABLE rutas 
      ADD COLUMN IF NOT EXISTS duracion_minutos_temp INTEGER;
    `;

    // 2. Convertir datos
    console.log("2. Convirtiendo datos de duracionHoras a minutos...");
    await sql`
      UPDATE rutas 
      SET duracion_minutos_temp = COALESCE(CAST(duracion_horas AS INTEGER) * 60, 5)
      WHERE duracion_horas IS NOT NULL;
    `;

    // 3. Actualizar NULLs
    console.log("3. Estableciendo valores por defecto para NULLs...");
    await sql`
      UPDATE rutas 
      SET duracion_minutos_temp = 5
      WHERE duracion_minutos_temp IS NULL;
    `;

    // 4. Dropear columna antigua
    console.log("4. Eliminando columna duracion_horas...");
    await sql`
      ALTER TABLE rutas 
      DROP COLUMN IF EXISTS duracion_horas CASCADE;
    `;

    // 5. Renombrar columna
    console.log("5. Renombrando columna a duracion_minutos...");
    await sql`
      ALTER TABLE rutas 
      RENAME COLUMN duracion_minutos_temp TO duracion_minutos;
    `;

    // 6. Agregar constraint NOT NULL
    console.log("6. Agregando constraint NOT NULL...");
    await sql`
      ALTER TABLE rutas 
      ALTER COLUMN duracion_minutos SET NOT NULL;
    `;

    // Verificar cambios
    console.log("7. Verificando cambios...");
    const result = await sql`
      SELECT id, nombre, duracion_minutos FROM rutas LIMIT 5;
    `;

    console.log("✅ Migración completada exitosamente!");
    console.log("Primeras 5 rutas:");
    console.log(result);

    await sql.end();
  } catch (error) {
    console.error("❌ Error durante la migración:", error);
    await sql.end();
    throw error;
  }
}

migrateDatabase();
