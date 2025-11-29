import 'dotenv/config';
import { db } from "./server/db";
import { sql } from "drizzle-orm";

async function checkTable() {
  try {
    console.log("📋 Verificando estructura de calificaciones...");
    
    const result = await db.execute(
      sql`
        SELECT column_name, data_type, is_nullable 
        FROM information_schema.columns 
        WHERE table_name = 'calificaciones'
        ORDER BY ordinal_position;
      `
    );
    
    console.log("Columnas actuales:");
    console.table(result);
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

checkTable();
