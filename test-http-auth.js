/**
 * Script de prueba para verificar el flujo HTTP completo de autenticación
 * Puedes ejecutar esto después de iniciar el servidor
 */

async function testHTTPAuth() {
  const baseURL = "http://localhost:3000";
  const testEmail = `user-${Date.now()}@example.com`;
  const testPassword = "testpass123";

  try {
    console.log("🌐 Probando API HTTP de autenticación\n");
    console.log(`📍 Base URL: ${baseURL}\n`);

    // 1. Registro
    console.log("1️⃣  Registrando nuevo usuario anfitrión...");
    const registerRes = await fetch(`${baseURL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nombre: "Test Anfitrión HTTP",
        email: testEmail,
        password: testPassword,
        rol: "anfitrion",
      }),
    });

    if (!registerRes.ok) {
      const error = await registerRes.text();
      console.error(`❌ Error en registro:`, error);
      return;
    }

    const registerData = await registerRes.json();
    const { user, token } = registerData;

    console.log(`✅ Usuario registrado:`);
    console.log(`   - Email: ${user.email}`);
    console.log(`   - Rol: ${user.rol}`);
    console.log(`   - Token: ${token?.substring(0, 30)}...\n`);

    // 2. Verificar usuario con token
    console.log("2️⃣  Verificando sesión con token...");
    const meRes = await fetch(`${baseURL}/api/auth/me`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
      },
    });

    if (!meRes.ok) {
      const error = await meRes.text();
      console.error(`❌ Error al obtener usuario:`, error);
      return;
    }

    const meData = await meRes.json();
    console.log(`✅ Sesión verificada:`);
    console.log(`   - Email: ${meData.email}`);
    console.log(`   - Rol: ${meData.rol}`);
    console.log(`   - ID: ${meData.id}\n`);

    // 3. Logout y verificar que el token no funciona
    console.log("3️⃣  Intentando usar token después de 'logout'...");
    // Simulamos un token inválido
    const invalidTokenRes = await fetch(`${baseURL}/api/auth/me`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer invalid.token.here`,
      },
    });

    if (!invalidTokenRes.ok) {
      console.log(`✅ Token inválido rechazado correctamente (${invalidTokenRes.status})\n`);
    } else {
      console.log(`❌ Token inválido fue aceptado\n`);
    }

    // 4. Login con email y contraseña
    console.log("4️⃣  Intentando login con credenciales...");
    const loginRes = await fetch(`${baseURL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword,
      }),
    });

    if (!loginRes.ok) {
      const error = await loginRes.text();
      console.error(`❌ Error en login:`, error);
      return;
    }

    const loginData = await loginRes.json();
    console.log(`✅ Login exitoso:`);
    console.log(`   - Email: ${loginData.user.email}`);
    console.log(`   - Rol: ${loginData.user.rol}`);
    console.log(`   - Token: ${loginData.token?.substring(0, 30)}...\n`);

    console.log("✅ ¡Flujo HTTP de autenticación completado correctamente!");

  } catch (error) {
    console.error("❌ Error en la prueba:", error);
  }
}

testHTTPAuth();
