import 'dotenv/config';
import { db } from "./server/db";
import { sql } from "drizzle-orm";

async function fixUserIdNullable() {
  try {
    console.log("🔧 Haciendo user_id nullable en calificaciones...");
    
    // Alter column to be nullable
    await db.execute(
      sql`ALTER TABLE calificaciones ALTER COLUMN user_id DROP NOT NULL;`
    );
    
    console.log("✅ Columna user_id ahora es nullable");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

fixUserIdNullable();
