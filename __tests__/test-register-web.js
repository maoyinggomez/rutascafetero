/**
 * Test del flujo de registro y login desde la web
 */

async function testRegisterAndLogin() {
  const baseURL = "http://localhost:3000";
  const timestamp = Date.now();
  const testEmail = `test-web-${timestamp}@example.com`;
  const testPassword = "password123";
  const testNombre = "Usuario Web Test";

  try {
    console.log("🌐 Test: Registro y Login desde Web\n");
    console.log(`📧 Email: ${testEmail}`);
    console.log(`👤 Nombre: ${testNombre}`);
    console.log(`🔐 Contraseña: ${testPassword}\n`);

    // 1. REGISTRO
    console.log("1️⃣  POST /api/auth/register");
    const registerRes = await fetch(`${baseURL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nombre: testNombre,
        email: testEmail,
        password: testPassword,
        rol: "anfitrion",
      }),
    });

    console.log(`   Status: ${registerRes.status}`);

    if (!registerRes.ok) {
      const error = await registerRes.json();
      console.error(`   ❌ Error:`, error);
      return;
    }

    const registerData = await registerRes.json();
    console.log(`   ✅ Registro exitoso`);
    console.log(`   - User ID: ${registerData.user.id}`);
    console.log(`   - Email: ${registerData.user.email}`);
    console.log(`   - Rol: ${registerData.user.rol}`);
    console.log(`   - Token: ${registerData.token.substring(0, 30)}...\n`);

    // 2. ESPERAR UN POCO
    console.log("⏳ Esperando 2 segundos...\n");
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 3. INTENTAR LOGIN CON MISMO EMAIL Y PASSWORD
    console.log("2️⃣  POST /api/auth/login (mismo email y password)");
    const loginRes = await fetch(`${baseURL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword,
      }),
    });

    console.log(`   Status: ${loginRes.status}`);

    if (!loginRes.ok) {
      const error = await loginRes.json();
      console.error(`   ❌ Login FALLÓ:`, error);
      console.error(`\n   ⚠️  PROBLEMA: El usuario se registró pero NO se puede hacer login`);
      console.error(`   Esto significa que el usuario NO se guardó en la BD`);
      return;
    }

    const loginData = await loginRes.json();
    console.log(`   ✅ Login exitoso`);
    console.log(`   - User ID: ${loginData.user.id}`);
    console.log(`   - Email: ${loginData.user.email}`);
    console.log(`   - Rol: ${loginData.user.rol}`);
    console.log(`   - Token: ${loginData.token.substring(0, 30)}...\n`);

    console.log("✅ TEST COMPLETADO EXITOSAMENTE");
    console.log("El usuario se registró y guardó en la BD correctamente");

  } catch (error) {
    console.error("❌ Error en la prueba:", error);
  }
}

testRegisterAndLogin();
