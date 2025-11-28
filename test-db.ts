import 'dotenv/config';
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./shared/schema.ts";
import { eq } from "drizzle-orm";

async function testDatabase() {
  console.log("🔍 Probando conexión a la base de datos...");
  
  if (!process.env.DATABASE_URL) {
    console.error("❌ DATABASE_URL no está configurada");
    process.exit(1);
  }

  try {
    const client = postgres(process.env.DATABASE_URL);
    const db = drizzle(client, { schema });

    // Primero, intenta obtener todos los usuarios
    console.log("\n📋 Obteniendo usuarios actuales...");
    const allUsers = await db.select().from(schema.users);
    console.log(`✅ Total de usuarios en la BD: ${allUsers.length}`);
    allUsers.forEach((u: any) => {
      console.log(`  - ${u.nombre} (${u.email}) - Rol: ${u.rol}`);
    });

    // Intenta crear un usuario de prueba
    console.log("\n➕ Creando usuario de prueba...");
    const testEmail = `test-${Date.now()}@example.com`;
    const testUser = await db.insert(schema.users).values({
      nombre: "Usuario Prueba",
      email: testEmail,
      password: "hashedpassword123",
      rol: "anfitrion",
    }).returning();
    
    console.log("✅ Usuario creado:", testUser[0]);

    // Verifica que el usuario fue guardado
    console.log("\n🔎 Verificando que el usuario fue guardado...");
    const savedUser = await db.select().from(schema.users).where(eq(schema.users.id, testUser[0].id));
    console.log("✅ Usuario recuperado de la BD:", savedUser[0]);

    console.log("\n✅ ¡Conexión a la BD funciona correctamente!");
    await client.end();
    
  } catch (error) {
    console.error("❌ Error al conectar a la BD:", error);
    process.exit(1);
  }
}

testDatabase();
