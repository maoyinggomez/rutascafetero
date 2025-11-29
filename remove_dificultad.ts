import postgres from "postgres";
import * as dotenv from "dotenv";

dotenv.config();

const sql = postgres(process.env.DATABASE_URL || "");

async function removeDificultad() {
  try {
    console.log("🔄 Removiendo columna 'dificultad' de la tabla 'rutas'...");

    await sql`
      ALTER TABLE rutas 
      DROP COLUMN IF EXISTS dificultad CASCADE;
    `;

    console.log("✅ Columna 'dificultad' eliminada exitosamente!");

    // Verificar estructura de la tabla
    const columns = await sql`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'rutas'
      ORDER BY ordinal_position;
    `;

    console.log("📋 Columnas actuales de la tabla 'rutas':");
    columns.forEach(col => {
      console.log(`   - ${col.column_name}: ${col.data_type}`);
    });

    await sql.end();
  } catch (error) {
    console.error("❌ Error:", error);
    await sql.end();
    throw error;
  }
}

removeDificultad();
