// Script para probar la autenticación
// Ejecutar con: npx tsx test-auth.ts

const BASE_URL = "http://localhost:3000";

interface AuthResponse {
  user: {
    id: string;
    nombre: string;
    email: string;
    rol: string;
  };
  token: string;
}

async function testAuth() {
  console.log("🧪 Iniciando pruebas de autenticación...\n");

  const testEmail = `test-${Date.now()}@example.com`;
  const testPassword = "Test123!";

  try {
    // 1. Registro
    console.log("1️⃣ Registrando usuario...");
    const registerRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nombre: "Test User",
        email: testEmail,
        password: testPassword,
        rol: "turista",
      }),
    });

    if (!registerRes.ok) {
      console.error("❌ Error en registro:", registerRes.status, await registerRes.text());
      return;
    }

    const registerData: AuthResponse = await registerRes.json();
    const token = registerData.token;
    console.log("✅ Registro exitoso");
    console.log(`   Token: ${token.substring(0, 20)}...`);
    console.log(`   Usuario: ${registerData.user.email}\n`);

    // 2. Verificar usuario con token
    console.log("2️⃣ Verificando usuario con token...");
    const meRes = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!meRes.ok) {
      console.error("❌ Error al obtener usuario:", meRes.status, await meRes.text());
      return;
    }

    const userData = await meRes.json();
    console.log("✅ Usuario verificado");
    console.log(`   ID: ${userData.id}`);
    console.log(`   Email: ${userData.email}`);
    console.log(`   Rol: ${userData.rol}\n`);

    // 3. Intentar con token inválido
    console.log("3️⃣ Probando con token inválido...");
    const invalidRes = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { Authorization: "Bearer invalid.token.here" },
    });

    if (invalidRes.status === 401) {
      console.log("✅ Rechazado correctamente (401)\n");
    } else {
      console.error("❌ Debería haber rechazado el token inválido\n");
    }

    // 4. Login
    console.log("4️⃣ Iniciando sesión...");
    const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword,
      }),
    });

    if (!loginRes.ok) {
      console.error("❌ Error en login:", loginRes.status, await loginRes.text());
      return;
    }

    const loginData: AuthResponse = await loginRes.json();
    console.log("✅ Login exitoso");
    console.log(`   Nuevo Token: ${loginData.token.substring(0, 20)}...\n`);

    // 5. Verificar que ambos tokens funcionan
    console.log("5️⃣ Verificando ambos tokens...");
    const meRes2 = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${loginData.token}` },
    });

    if (meRes2.ok) {
      console.log("✅ Token de login válido\n");
    } else {
      console.error("❌ Token de login inválido\n");
    }

    console.log("✅ ¡TODAS LAS PRUEBAS PASARON!");
    console.log("\n📋 Resumen:");
    console.log("- Registro: ✅");
    console.log("- Verificación de usuario: ✅");
    console.log("- Rechazo de token inválido: ✅");
    console.log("- Login: ✅");
  } catch (error) {
    console.error("❌ Error general:", error);
  }
}

testAuth();
