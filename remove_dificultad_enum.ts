import postgres from "postgres";
import * as dotenv from "dotenv";

dotenv.config();

const sql = postgres(process.env.DATABASE_URL || "");

async function removeDificultadEnum() {
  try {
    console.log("🔄 Removiendo enum 'dificultad' de PostgreSQL...");

    // Primero, intentar dropear el enum
    await sql`
      DROP TYPE IF EXISTS dificultad CASCADE;
    `;

    console.log("✅ Enum 'dificultad' eliminado exitosamente!");

    // Listar enums restantes
    const enums = await sql`
      SELECT typname FROM pg_type WHERE typtype = 'e';
    `;

    console.log("📋 Enums restantes en PostgreSQL:");
    enums.forEach(e => {
      console.log(`   - ${e.typname}`);
    });

    await sql.end();
  } catch (error) {
    console.error("❌ Error:", error);
    await sql.end();
    throw error;
  }
}

removeDificultadEnum();
