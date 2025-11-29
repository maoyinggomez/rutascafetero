import 'dotenv/config';
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./shared/schema.ts";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "supersecreto123";
const SALT_ROUNDS = 10;

async function testAuthFlow() {
  console.log("🔐 Probando flujo completo de autenticación...\n");
  
  if (!process.env.DATABASE_URL) {
    console.error("❌ DATABASE_URL no está configurada");
    process.exit(1);
  }

  try {
    const client = postgres(process.env.DATABASE_URL);
    const db = drizzle(client, { schema });

    // 1. Crear un usuario de anfitrión
    console.log("1️⃣  Creando usuario anfitrión...");
    const testEmail = `anfitrion-test-${Date.now()}@example.com`;
    const testPassword = "password123";
    const hashedPassword = await bcrypt.hash(testPassword, SALT_ROUNDS);

    const newUser = await db.insert(schema.users).values({
      nombre: "Test Anfitrión",
      email: testEmail,
      password: hashedPassword,
      rol: "anfitrion",
    }).returning();

    const userId = newUser[0].id;
    console.log(`✅ Usuario creado: ${newUser[0].email} (ID: ${userId})\n`);

    // 2. Simular login: verificar usuario y contraseña
    console.log("2️⃣  Simulando login...");
    const foundUser = await db.select().from(schema.users).where(eq(schema.users.email, testEmail));
    
    if (!foundUser.length) {
      console.error("❌ Usuario no encontrado después de crear");
      process.exit(1);
    }

    const user = foundUser[0];
    const passwordMatch = await bcrypt.compare(testPassword, user.password);
    
    if (!passwordMatch) {
      console.error("❌ Contraseña no coincide");
      process.exit(1);
    }

    console.log(`✅ Login exitoso: ${user.email}\n`);

    // 3. Generar token JWT
    console.log("3️⃣  Generando token JWT...");
    const token = jwt.sign({
      userId: user.id,
      email: user.email,
      rol: user.rol,
    }, JWT_SECRET, { expiresIn: "7d" });

    console.log(`✅ Token generado: ${token.substring(0, 20)}...\n`);

    // 4. Verificar token
    console.log("4️⃣  Verificando token...");
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    console.log(`✅ Token válido:`, decoded);
    console.log(`   - userId: ${decoded.userId}`);
    console.log(`   - email: ${decoded.email}`);
    console.log(`   - rol: ${decoded.rol}\n`);

    // 5. Recuperar usuario con token
    console.log("5️⃣  Recuperando usuario con token...");
    const recoveredUser = await db.select().from(schema.users).where(eq(schema.users.id, decoded.userId));
    console.log(`✅ Usuario recuperado:`, {
      id: recoveredUser[0].id,
      nombre: recoveredUser[0].nombre,
      email: recoveredUser[0].email,
      rol: recoveredUser[0].rol,
    });

    console.log("\n✅ ¡Flujo de autenticación completado correctamente!");
    console.log("\n📝 RESUMEN:");
    console.log(`   - Usuario creado: ${testEmail}`);
    console.log(`   - Rol: ${user.rol}`);
    console.log(`   - Token generado y verificado`);
    console.log(`   - Usuario recuperable por ID del token`);

    await client.end();
    
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

testAuthFlow();
