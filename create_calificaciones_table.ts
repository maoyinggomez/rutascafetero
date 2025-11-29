import 'dotenv/config';
import { db } from "./server/db";
import { sql } from "drizzle-orm";

async function createCalificacionesTable() {
  try {
    console.log("📋 Creando tabla calificaciones...");
    
    // Create the table with all columns including user_id as nullable
    await db.execute(
      sql`
        CREATE TABLE IF NOT EXISTS calificaciones (
          id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
          reserva_id VARCHAR NOT NULL REFERENCES reservas(id),
          user_id VARCHAR REFERENCES users(id),
          ruta_id VARCHAR NOT NULL REFERENCES rutas(id),
          rating INTEGER NOT NULL,
          comentario TEXT,
          created_at TIMESTAMP NOT NULL DEFAULT now()
        );
      `
    );
    
    console.log("✅ Tabla calificaciones creada o ya existe");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

createCalificacionesTable();
