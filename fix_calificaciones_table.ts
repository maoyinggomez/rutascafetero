import 'dotenv/config';
import { db } from "./server/db";
import { sql } from "drizzle-orm";

async function fixCalificacionesTable() {
  try {
    console.log("🔧 Reconstruyendo tabla calificaciones con estructura correcta...");
    
    // Drop the old table
    await db.execute(sql`DROP TABLE IF EXISTS calificaciones CASCADE;`);
    console.log("  ✓ Tabla antigua eliminada");
    
    // Create the new table with correct structure
    await db.execute(
      sql`
        CREATE TABLE calificaciones (
          id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
          reserva_id VARCHAR NOT NULL REFERENCES reservas(id),
          user_id VARCHAR REFERENCES users(id),
          ruta_id VARCHAR NOT NULL REFERENCES rutas(id),
          rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
          comentario TEXT,
          created_at TIMESTAMP NOT NULL DEFAULT now()
        );
      `
    );
    console.log("  ✓ Nueva tabla creada con estructura correcta");
    
    // Create index for faster queries
    await db.execute(
      sql`CREATE INDEX idx_calificaciones_reserva ON calificaciones(reserva_id);`
    );
    await db.execute(
      sql`CREATE INDEX idx_calificaciones_ruta ON calificaciones(ruta_id);`
    );
    console.log("  ✓ Índices creados");
    
    console.log("\n✅ Tabla calificaciones reconstruida exitosamente");
    console.log("\nEstructura actual:");
    const result = await db.execute(
      sql`
        SELECT column_name, data_type, is_nullable 
        FROM information_schema.columns 
        WHERE table_name = 'calificaciones'
        ORDER BY ordinal_position;
      `
    );
    console.table(result);
    
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

fixCalificacionesTable();
