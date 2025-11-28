import 'dotenv/config';
import { db } from "./db";
import { sql } from "drizzle-orm";

async function migrate() {
  console.log("🔄 Aplicando migración para agregar columna 'imagenes'...");
  
  try {
    // Agregar columna imagenes si no existe
    await db.execute(sql`
      ALTER TABLE rutas ADD COLUMN IF NOT EXISTS imagenes text[] DEFAULT ARRAY[]::text[]
    `);
    console.log("✅ Columna 'imagenes' agregada correctamente");

    // Hacer imagen_url nullable
    await db.execute(sql`
      ALTER TABLE rutas ALTER COLUMN imagen_url DROP NOT NULL
    `);
    console.log("✅ Columna 'imagen_url' ahora es nullable");

    console.log("✅ Migración completada exitosamente");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error en migración:", error);
    process.exit(1);
  }
}

migrate();
