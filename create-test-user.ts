import 'dotenv/config';
import { db } from './server/db';
import { users } from '@shared/schema';
import { hashPassword } from './server/auth';

async function createTestUser() {
  try {
    console.log('🔄 Creando usuario de prueba...');
    
    const hashedPassword = await hashPassword('password123');
    
    const newUser = await db.insert(users).values({
      id: 'test-user-' + Date.now(),
      nombre: 'Juan Test',
      email: 'test@test.com',
      password: hashedPassword,
      rol: 'turista',
      rol_validado: false,
      suspendido: false,
    }).returning();

    console.log('✅ Usuario creado:');
    console.log('   Email: test@test.com');
    console.log('   Password: password123');
    console.log('   ID:', newUser[0].id);
    
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

createTestUser();
