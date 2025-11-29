const BASE_URL = 'http://localhost:3000';

async function testTransiciones() {
  try {
    console.log('=== PRUEBA DE TRANSICIONES DE ESTADO ===\n');

    // Primero necesitamos registrar un turista para crear una reserva
    console.log('1️⃣  Registrando turista...');
    const turista = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nombre: `Turista Transiciones ${Date.now()}`,
        email: `turista-${Date.now()}@test.com`,
        password: 'password123',
        rol: 'turista',
      }),
    }).then(r => r.json());
    const turistaToken = turista.token;
    console.log(`✅ Turista registrado\n`);

    // Registrar anfitrion
    console.log('2️⃣  Registrando anfitrion...');
    const anfitrion = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nombre: `Anfitrion Transiciones ${Date.now()}`,
        email: `anfitrion-${Date.now()}@test.com`,
        password: 'password123',
        rol: 'anfitrion',
      }),
    }).then(r => r.json());
    const anfitrionToken = anfitrion.token;
    console.log(`✅ Anfitrion registrado\n`);

    // Crear ruta como anfitrion
    console.log('3️⃣  Creando ruta como anfitrion...');
    const rutaRes = await fetch(`${BASE_URL}/api/rutas`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${anfitrionToken}`,
      },
      body: JSON.stringify({
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
      }),
    }).then(r => r.json());
    const rutaId = rutaRes.id;
    console.log(`✅ Ruta creada: ${rutaId}\n`);

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
    console.log(`   Estado actual: ${reservaRes.estado}\n`);

    // Intentar transición válida: pendiente -> confirmada
    console.log('5️⃣  Confirmando reserva (pendiente -> confirmada)...');
    const res2 = await fetch(`${BASE_URL}/api/reservas/${reservaId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${anfitrionToken}`,
      },
      body: JSON.stringify({ estado: 'confirmada' }),
    }).then(r => r.json());
    console.log(`✅ Transición exitosa: ${res2.estado}\n`);

    // Intentar transición válida: confirmada -> cancelada
    console.log('6️⃣  Cancelando reserva confirmada (confirmada -> cancelada)...');
    const res3 = await fetch(`${BASE_URL}/api/reservas/${reservaId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${anfitrionToken}`,
      },
      body: JSON.stringify({ estado: 'cancelada' }),
    }).then(r => r.json());
    console.log(`✅ Transición exitosa: ${res3.estado}\n`);

    // Intentar transición INVÁLIDA: cancelada -> confirmada
    console.log('7️⃣  Intentando transición inválida (cancelada -> confirmada)...');
    const res4 = await fetch(`${BASE_URL}/api/reservas/${reservaId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${anfitrionToken}`,
      },
      body: JSON.stringify({ estado: 'confirmada' }),
    }).then(r => r.json());
    
    if (res4.error && res4.error.includes('Transición')) {
      console.log(`✅ Validación de transición funcionó correctamente`);
      console.log(`   Error: ${res4.error}\n`);
    } else {
      console.log(`❌ ERROR: ${JSON.stringify(res4)}\n`);
    }

    console.log('=== PRUEBA COMPLETADA ===');
  } catch (error) {
    console.error('Error:', error);
  }
}

testTransiciones();
