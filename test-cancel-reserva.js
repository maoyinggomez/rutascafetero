const BASE_URL = 'http://localhost:3000';

async function testCancelReserva() {
  try {
    console.log('=== PRUEBA DE CANCELACIÓN DE RESERVA POR TURISTA ===\n');

    // Registrar turista
    console.log('1️⃣  Registrando turista...');
    const turista = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nombre: `Turista Cancel ${Date.now()}`,
        email: `turista-cancel-${Date.now()}@test.com`,
        password: 'password123',
        rol: 'turista',
      }),
    }).then(r => r.json());
    const turistaToken = turista.token;
    const turistaId = turista.user.id;
    console.log(`✅ Turista registrado\n`);

    // Registrar anfitrion
    console.log('2️⃣  Registrando anfitrion...');
    const anfitrion = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nombre: `Anfitrion Cancel ${Date.now()}`,
        email: `anfitrion-cancel-${Date.now()}@test.com`,
        password: 'password123',
        rol: 'anfitrion',
      }),
    }).then(r => r.json());
    const anfitrionToken = anfitrion.token;
    console.log(`✅ Anfitrion registrado\n`);

    // Crear ruta como anfitrion
    console.log('3️⃣  Creando ruta...');
    const rutaRes = await fetch(`${BASE_URL}/api/rutas`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${anfitrionToken}`,
      },
      body: JSON.stringify({
        nombre: 'Ruta Cancel Test',
        descripcion: 'Test cancelación',
        destino: 'Test',
        dificultad: 'Fácil',
        duracion: '2 horas',
        duracionHoras: 2,
        precio: 50000,
        precioPorPersona: 50000,
        cupoMaximo: 5,
        tags: ['test'],
      }),
    }).then(r => r.json());
    const rutaId = rutaRes.id;
    console.log(`✅ Ruta creada\n`);

    // Crear reserva como turista
    console.log('4️⃣  Creando reserva...');
    const reservaRes = await fetch(`${BASE_URL}/api/reservas`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${turistaToken}`,
      },
      body: JSON.stringify({
        rutaId,
        fechaRuta: new Date(Date.now() + 86400000).toISOString(),
        cantidadPersonas: 2,
        totalPagado: 100000,
      }),
    }).then(r => r.json());
    const reservaId = reservaRes.id;
    console.log(`✅ Reserva creada: ${reservaId}`);
    console.log(`   Estado: ${reservaRes.estado}\n`);

    // Turista cancela su reserva (DELETE)
    console.log('5️⃣  Turista cancela su reserva (DELETE)...');
    const cancelRes = await fetch(`${BASE_URL}/api/reservas/${reservaId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${turistaToken}`,
      },
    }).then(r => r.json());
    
    if (cancelRes.message && cancelRes.message.includes('cancelada')) {
      console.log(`✅ Cancelación exitosa`);
      console.log(`   Nuevo estado: ${cancelRes.reserva.estado}\n`);
    } else {
      console.log(`❌ ERROR: ${JSON.stringify(cancelRes)}\n`);
    }

    // Crear otra reserva
    console.log('6️⃣  Creando otra reserva...');
    const reservaRes2 = await fetch(`${BASE_URL}/api/reservas`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${turistaToken}`,
      },
      body: JSON.stringify({
        rutaId,
        fechaRuta: new Date(Date.now() + 86400000).toISOString(),
        cantidadPersonas: 1,
        totalPagado: 50000,
      }),
    }).then(r => r.json());
    const reservaId2 = reservaRes2.id;
    console.log(`✅ Reserva creada: ${reservaId2}\n`);

    // Turista intenta cancelar reserva de otro turista (debería fallar)
    console.log('7️⃣  Turista intenta cancelar reserva de otro turista (debería fallar)...');
    
    // Crear otro turista
    const turista2 = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nombre: `Turista 2 ${Date.now()}`,
        email: `turista2-${Date.now()}@test.com`,
        password: 'password123',
        rol: 'turista',
      }),
    }).then(r => r.json());
    const turista2Token = turista2.token;
    
    const cancelRes2 = await fetch(`${BASE_URL}/api/reservas/${reservaId2}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${turista2Token}`,
      },
    }).then(r => r.json());
    
    if (cancelRes2.error && cancelRes2.error.includes('permisos')) {
      console.log(`✅ Control de permisos funcionó correctamente`);
      console.log(`   Error: ${cancelRes2.error}\n`);
    } else {
      console.log(`❌ ERROR: ${JSON.stringify(cancelRes2)}\n`);
    }

    console.log('=== PRUEBA COMPLETADA ===');
  } catch (error) {
    console.error('Error:', error);
  }
}

testCancelReserva();
