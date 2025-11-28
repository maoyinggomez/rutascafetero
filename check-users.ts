import 'dotenv/config';
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./shared/schema.ts";

async function checkUsers() {
  console.log("🔍 Verificando usuarios en la BD Neon\n");
  
  if (!process.env.DATABASE_URL) {
    console.error("❌ DATABASE_URL no está configurada");
    process.exit(1);
  }

  try {
    const client = postgres(process.env.DATABASE_URL);
    const db = drizzle(client, { schema });

    // Obtener todos los usuarios
    console.log("📋 Obteniendo usuarios de la BD...\n");
    const allUsers = await db.select().from(schema.users);

    console.log(`✅ Total de usuarios en la BD: ${allUsers.length}\n`);
    
    if (allUsers.length === 0) {
      console.log("⚠️  No hay usuarios en la BD");
    } else {
      console.log("=" .repeat(80));
      console.log("USUARIOS EN LA BD:");
      console.log("=" .repeat(80));
      
      allUsers.forEach((user, index) => {
        console.log(`\n${index + 1}. ${user.nombre}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Rol: ${user.rol}`);
        console.log(`   ID: ${user.id}`);
        console.log(`   Password Hash: ${user.password.substring(0, 30)}...`);
      });
    }

    console.log("\n" + "=" .repeat(80));
    console.log(`📊 RESUMEN: ${allUsers.length} usuarios en total`);
    
    // Contar por rol
    const porRol = {};
    allUsers.forEach(u => {
      porRol[u.rol] = (porRol[u.rol] || 0) + 1;
    });
    
    console.log("\nPor rol:");
    Object.entries(porRol).forEach(([rol, count]) => {
      console.log(`  - ${rol}: ${count}`);
    });

    await client.end();
    
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

checkUsers();
