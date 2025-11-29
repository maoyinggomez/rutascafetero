import axios from 'axios';

const BASE_URL = 'http://localhost:3000';

async function testCupoValidation() {
  try {
    console.log('=== PRUEBA DE VALIDACIÓN DE CUPO ===\n');

    // 1. Registrar turista
    console.log('1️⃣  Registrando turista...');
    const registerRes = await axios.post(`${BASE_URL}/api/auth/register`, {
      nombre: 'Test Cupo User',
      email: `testcupo-${Date.now()}@test.com`,
      password: 'password123',
      rol: 'turista',
    });
    const token = registerRes.data.token;
    const userId = registerRes.data.user.id;
    console.log(`✅ Turista registrado: ${userId}\n`);

    // 2. Crear una ruta con cupo máximo de 2
    console.log('2️⃣  Creando ruta con cupo máximo de 2...');
    const admin_token = 'admin-token-needed'; // En prueba real necesitarías token de admin
    const rutaRes = await axios.post(`${BASE_URL}/api/rutas`, {
      nombre: 'Ruta Test Cupo',
      descripcion: 'Test',
      destino: 'Test Destino',
      dificultad: 'Fácil',
      duracion: '2 horas',
      duracionHoras: 2,
      precio: 50000,
      precioPorPersona: 50000,
      cupoMaximo: 2,
      tags: ['test'],
    }, {
      headers: { Authorization: `Bearer ${token}` }
    }).catch(e => console.log('⚠️  Error: Probablemente necesitas ser admin/anfitrion'));

    if (!rutaRes) return;
    const rutaId = rutaRes.data.id;
    console.log(`✅ Ruta creada: ${rutaId}\n`);

    // 3. Primera reserva: 2 personas (debería funcionar)
    console.log('3️⃣  Intentando primera reserva de 2 personas (dentro del cupo)...');
    const res1 = await axios.post(`${BASE_URL}/api/reservas`, {
      rutaId,
      fechaRuta: new Date(Date.now() + 86400000).toISOString(),
      cantidadPersonas: 2,
      totalPagado: 100000,
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log(`✅ Primera reserva exitosa\n`);

    // 4. Segunda reserva: 1 persona (debería fallar - no hay cupo)
    console.log('4️⃣  Intentando segunda reserva de 1 persona (SIN cupo disponible)...');
    try {
      const res2 = await axios.post(`${BASE_URL}/api/reservas`, {
        rutaId,
        fechaRuta: new Date(Date.now() + 86400000).toISOString(),
        cantidadPersonas: 1,
        totalPagado: 50000,
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log(`❌ ERROR: Debería haber fallado pero funcionó`);
    } catch (error: any) {
      if (error.response?.status === 400 && error.response?.data?.error?.includes('cupo')) {
        console.log(`✅ Validación de cupo funcionó correctamente`);
        console.log(`   Error: ${error.response.data.error}\n`);
      } else {
        console.log(`❌ Error inesperado: ${error.response?.data?.error}\n`);
      }
    }

    console.log('=== PRUEBA COMPLETADA ===');
  } catch (error: any) {
    console.error('Error:', error.response?.data || error.message);
  }
}

testCupoValidation();
