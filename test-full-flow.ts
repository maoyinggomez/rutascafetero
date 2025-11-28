import 'dotenv/config';

const BASE_URL = 'http://localhost:3000/api';

interface TestResult {
  name: string;
  status: 'PASS' | 'FAIL';
  details: string;
}

const results: TestResult[] = [];

async function test(name: string, fn: () => Promise<void>) {
  try {
    await fn();
    results.push({ name, status: 'PASS', details: '✅' });
    console.log(`✅ ${name}`);
  } catch (error: any) {
    results.push({ name, status: 'FAIL', details: error.message });
    console.error(`❌ ${name}: ${error.message}`);
  }
}

async function main() {
  console.log('🧪 PRUEBAS DEL SISTEMA COMPLETO\n');

  let token = '';
  let userId = '';
  let rutaId = '';
  let reservaId = '';

  // Test 1: Login
  await test('Login con usuario', async () => {
    const response = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@test.com', password: 'password123' }),
    });
    
    if (response.status !== 200) throw new Error(`Status ${response.status}`);
    
    const data = await response.json();
    token = data.token;
    userId = data.user.id;
    
    if (!token) throw new Error('No token received');
  });

  // Test 2: Obtener rutas
  await test('Obtener rutas disponibles', async () => {
    const response = await fetch(`${BASE_URL}/rutas`);
    if (response.status !== 200) throw new Error(`Status ${response.status}`);
    
    const data = await response.json();
    if (!Array.isArray(data)) throw new Error('Response is not an array');
    if (data.length === 0) throw new Error('No routes found');
    
    rutaId = data[0].id;
  });

  // Test 3: Obtener notificaciones (debe estar vacío)
  await test('Obtener notificaciones iniciales', async () => {
    const response = await fetch(`${BASE_URL}/notificaciones`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    
    if (response.status !== 200) throw new Error(`Status ${response.status}`);
    
    const data = await response.json();
    if (!Array.isArray(data)) throw new Error('Response is not an array');
  });

  // Test 4: Crear reserva
  await test('Crear reserva en ruta', async () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const response = await fetch(`${BASE_URL}/reservas`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        ruta_id: rutaId,
        fecha_reserva: tomorrow.toISOString().split('T')[0],
        cantidad_personas: 2,
        precio_por_persona: 50000,
      }),
    });
    
    if (response.status !== 201 && response.status !== 200) {
      const error = await response.text();
      throw new Error(`Status ${response.status}: ${error}`);
    }
    
    const data = await response.json();
    reservaId = data.id;
    
    if (!reservaId) throw new Error('No reservation ID received');
  });

  // Test 5: Verificar que se creó notificación automática
  await test('Verificar notificación automática de reserva', async () => {
    // Esperar 1 segundo para que la notificación se cree
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const response = await fetch(`${BASE_URL}/notificaciones`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    
    if (response.status !== 200) throw new Error(`Status ${response.status}`);
    
    const data = await response.json();
    if (data.length === 0) throw new Error('No notifications found');
  });

  // Test 6: Crear check-in
  await test('Registrar check-in en reserva', async () => {
    const response = await fetch(`${BASE_URL}/reservas/${reservaId}/checkin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        ubicacion: 'Valle de Cocora, Salento',
      }),
    });
    
    if (response.status !== 201 && response.status !== 200) {
      const error = await response.text();
      throw new Error(`Status ${response.status}: ${error}`);
    }
  });

  // Test 7: Obtener check-ins
  await test('Obtener historial de check-ins', async () => {
    const response = await fetch(`${BASE_URL}/reservas/${reservaId}/checkins`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    
    if (response.status !== 200) throw new Error(`Status ${response.status}`);
    
    const data = await response.json();
    if (!Array.isArray(data)) throw new Error('Response is not an array');
    if (data.length === 0) throw new Error('No check-ins found');
  });

  // Test 8: Crear calificación
  await test('Crear calificación de ruta', async () => {
    const response = await fetch(`${BASE_URL}/reservas/${reservaId}/calificar`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        puntuacion: 5,
        comentario: 'Excelente experiencia',
      }),
    });
    
    if (response.status !== 201 && response.status !== 200) {
      const error = await response.text();
      throw new Error(`Status ${response.status}: ${error}`);
    }
  });

  // Test 9: Obtener calificaciones de ruta
  await test('Obtener calificaciones de ruta', async () => {
    const response = await fetch(`${BASE_URL}/rutas/${rutaId}/calificaciones`);
    
    if (response.status !== 200) throw new Error(`Status ${response.status}`);
    
    const data = await response.json();
    if (!Array.isArray(data)) throw new Error('Response is not an array');
    if (data.length === 0) throw new Error('No ratings found');
  });

  // Print results
  console.log('\n' + '='.repeat(50));
  console.log('📊 RESULTADOS DE PRUEBAS');
  console.log('='.repeat(50));
  
  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  
  results.forEach(r => {
    console.log(`${r.status === 'PASS' ? '✅' : '❌'} ${r.name}`);
  });
  
  console.log('\n' + '='.repeat(50));
  console.log(`Total: ${results.length} pruebas | ✅ ${passed} pasadas | ❌ ${failed} fallidas`);
  console.log('='.repeat(50));
  
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
});
