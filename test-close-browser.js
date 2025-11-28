/**
 * Test: Simular cerrar y abrir navegador
 * Este test intenta replicar exactamente lo que el usuario hace manualmente
 */

async function testCloseBrowserAndReopen() {
  const baseURL = "http://localhost:3000";
  const timestamp = Date.now();
  const testEmail = `browser-test-${timestamp}@example.com`;
  const testPassword = "password123";

  try {
    console.log("🌐 TEST: Cerrar Navegador y Reabrirlo\n");
    console.log("=" .repeat(60));

    // PARTE 1: REGISTRARSE
    console.log("\n📱 NAVEGADOR 1 - Registrarse\n");
    console.log(`📧 Email: ${testEmail}`);
    console.log(`🔐 Contraseña: ${testPassword}\n`);

    const registerRes = await fetch(`${baseURL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nombre: "Test Usuario Browser",
        email: testEmail,
        password: testPassword,
        rol: "anfitrion",
      }),
    });

    if (!registerRes.ok) {
      console.error("❌ Error al registrarse:", await registerRes.json());
      return;
    }

    const { user, token } = await registerRes.json();
    console.log("✅ Registro exitoso");
    console.log(`   Token: ${token.substring(0, 40)}...`);
    console.log(`   Usuario ID: ${user.id}`);
    console.log(`   Rol: ${user.rol}\n`);

    // SIMULAMOS: El usuario cierra el navegador
    console.log("=" .repeat(60));
    console.log("🔌 [USUARIO CIERRA EL NAVEGADOR]");
    console.log("   - localStorage se borra");
    console.log("   - Session storage se borra");
    console.log("   - Cookies se mantienen (si existen)\n");
    console.log("=" .repeat(60));

    // ESPERAR PARA SIMULAR TIEMPO TRANSCURRIDO
    console.log("\n⏳ Esperando 3 segundos (simulando tiempo cerrado)...\n");
    await new Promise(resolve => setTimeout(resolve, 3000));

    // PARTE 2: REABRE EL NAVEGADOR (sin el token en memoria)
    console.log("📱 NAVEGADOR REABIERTO\n");
    console.log("Escenario 1: El cliente intenta cargar la app");
    console.log("   - localStorage ESTÁ VACÍO");
    console.log("   - No hay token en memoria");
    console.log("   - El cliente debe verificar /api/auth/me sin token\n");

    const meWithoutTokenRes = await fetch(`${baseURL}/api/auth/me`, {
      method: "GET",
      headers: {
        // NO enviamos token (simulando que localStorage estaba vacío)
      },
    });

    console.log(`GET /api/auth/me (sin token)`);
    console.log(`   Status: ${meWithoutTokenRes.status}`);
    
    if (meWithoutTokenRes.status === 401) {
      console.log("   ✅ Correcto: Sin token → 401\n");
    }

    // AHORA SIMULAMOS: El cliente intenta login con email/password
    console.log("Escenario 2: El usuario intenta hacer login\n");

    const loginRes = await fetch(`${baseURL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword,
      }),
    });

    console.log(`POST /api/auth/login`);
    console.log(`   Status: ${loginRes.status}`);

    if (!loginRes.ok) {
      const error = await loginRes.json();
      console.error(`   ❌ ERROR: ${error.error}`);
      console.error("\n   PROBLEMA: El usuario NO se encuentra en la BD");
      console.error("   Esto significa que el registro NO se guardó");
      return;
    }

    const loginData = await loginRes.json();
    console.log(`   ✅ Login exitoso`);
    console.log(`   Token: ${loginData.token.substring(0, 40)}...`);
    console.log(`   Usuario ID: ${loginData.user.id}\n`);

    // VERIFICAR QUE EL USUARIO GUARDADO ES EL MISMO
    if (loginData.user.id === user.id && loginData.user.email === user.email) {
      console.log("✅ TEST EXITOSO:");
      console.log("   1. Se registró correctamente");
      console.log("   2. Se guardó en la BD");
      console.log("   3. Pudo hacer login después de cerrar navegador");
      console.log(`\n🎉 El usuario ${user.email} se mantuvo en la BD correctamente`);
    } else {
      console.error("❌ IDs no coinciden - algo está mal");
    }

  } catch (error) {
    console.error("❌ Error:", error);
  }
}

testCloseBrowserAndReopen();
