import axios from 'axios';

const BASE_URL = 'http://localhost:3000';

async function testTransiciones() {
  try {
    console.log('=== PRUEBA DE TRANSICIONES DE ESTADO ===\n');

    // Primero necesitamos registrar un turista para crear una reserva
    console.log('1️⃣  Registrando turista...');
    const turista = await axios.post(`${BASE_URL}/api/auth/register`, {
      nombre: `Turista Transiciones ${Date.now()}`,
      email: `turista-${Date.now()}@test.com`,
      password: 'password123',
      rol: 'turista',
    });
    const turistaToken = turista.data.token;
    console.log(`✅ Turista registrado\n`);

    // Registrar anfitrion
    console.log('2️⃣  Registrando anfitrion...');
    const anfitrion = await axios.post(`${BASE_URL}/api/auth/register`, {
      nombre: `Anfitrion Transiciones ${Date.now()}`,
      email: `anfitrion-${Date.now()}@test.com`,
      password: 'password123',
      rol: 'anfitrion',
    });
    const anfitrionToken = anfitrion.data.token;
    const anfitrionId = anfitrion.data.user.id;
    console.log(`✅ Anfitrion registrado\n`);

    // Crear ruta como anfitrion
    console.log('3️⃣  Creando ruta como anfitrion...');
    const rutaRes = await axios.post(`${BASE_URL}/api/rutas`, {
      nombre: 'Ruta Transiciones',
      descripcion: 'Test transiciones',
      destino: 'Test',
      dificultad: 'Fácil',
      duracion: '2 horas',
      duracionHoras: 2,
      precio: 50000,
      precioPorPersona: 50000,
      cupoMaximo: 5,
      tags: ['test'],
    }, {
      headers: { Authorization: `Bearer ${anfitrionToken}` }
    });
    const rutaId = rutaRes.data.id;
    console.log(`✅ Ruta creada: ${rutaId}\n`);

    // Crear reserva como turista
    console.log('4️⃣  Creando reserva...');
    const reservaRes = await axios.post(`${BASE_URL}/api/reservas`, {
      rutaId,
      fechaRuta: new Date(Date.now() + 86400000).toISOString(),
      cantidadPersonas: 2,
      totalPagado: 100000,
    }, {
      headers: { Authorization: `Bearer ${turistaToken}` }
    });
    const reservaId = reservaRes.data.id;
    console.log(`✅ Reserva creada: ${reservaId}`);
    console.log(`   Estado actual: ${reservaRes.data.estado}\n`);

    // Intentar transición válida: pendiente -> confirmada
    console.log('5️⃣  Confirmando reserva (pendiente -> confirmada)...');
    const res2 = await axios.patch(`${BASE_URL}/api/reservas/${reservaId}`, {
      estado: 'confirmada',
    }, {
      headers: { Authorization: `Bearer ${anfitrionToken}` }
    });
    console.log(`✅ Transición exitosa: ${res2.data.estado}\n`);

    // Intentar transición válida: confirmada -> cancelada
    console.log('6️⃣  Cancelando reserva confirmada (confirmada -> cancelada)...');
    const res3 = await axios.patch(`${BASE_URL}/api/reservas/${reservaId}`, {
      estado: 'cancelada',
    }, {
      headers: { Authorization: `Bearer ${anfitrionToken}` }
    });
    console.log(`✅ Transición exitosa: ${res3.data.estado}\n`);

    // Intentar transición INVÁLIDA: cancelada -> confirmada
    console.log('7️⃣  Intentando transición inválida (cancelada -> confirmada)...');
    try {
      await axios.patch(`${BASE_URL}/api/reservas/${reservaId}`, {
        estado: 'confirmada',
      }, {
        headers: { Authorization: `Bearer ${anfitrionToken}` }
      });
      console.log(`❌ ERROR: Debería haber fallado\n`);
    } catch (error: any) {
      if (error.response?.status === 400 && error.response?.data?.error?.includes('Transición')) {
        console.log(`✅ Validación de transición funcionó correctamente`);
        console.log(`   Error: ${error.response.data.error}\n`);
      } else {
        console.log(`❌ Error inesperado: ${error.response?.data?.error}\n`);
      }
    }

    console.log('=== PRUEBA COMPLETADA ===');
  } catch (error: any) {
    console.error('Error:', error.response?.data || error.message);
    console.error(error);
  }
}

testTransiciones();
