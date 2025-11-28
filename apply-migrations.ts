import 'dotenv/config';
import { db } from './server/db';

async function applyMigrations() {
  try {
    console.log('🔄 Aplicando migraciones...');
    
    // RN-11: Agregar campos de moderación
    console.log('\n1️⃣ Agregando campos de moderación...');
    await db.execute(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS rol_validado BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS suspendido BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS motivo_suspension TEXT,
      ADD COLUMN IF NOT EXISTS fecha_suspension TIMESTAMP
    `);
    console.log('   ✅ OK');

    // RN-10: Agregar datos personales
    console.log('\n2️⃣ Agregando campos de datos personales...');
    await db.execute(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS telefono TEXT,
      ADD COLUMN IF NOT EXISTS direccion TEXT,
      ADD COLUMN IF NOT EXISTS ciudad TEXT
    `);
    console.log('   ✅ OK');

    // RN-08: Mejorar reservas
    console.log('\n3️⃣ Agregando campos de reservas...');
    await db.execute(`
      ALTER TABLE reservas
      ADD COLUMN IF NOT EXISTS precio_por_persona_al_momento INTEGER,
      ADD COLUMN IF NOT EXISTS cerrada_auto BOOLEAN DEFAULT false
    `);
    console.log('   ✅ OK');

    // RN-09: Check-ins
    console.log('\n4️⃣ Creando tabla checkins...');
    await db.execute(`
      CREATE TABLE IF NOT EXISTS checkins (
        id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
        reserva_id VARCHAR(36) NOT NULL REFERENCES reservas(id) ON DELETE CASCADE,
        usuario_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        fecha_hora TIMESTAMP NOT NULL DEFAULT now(),
        ubicacion TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT now()
      )
    `);
    console.log('   ✅ OK');

    // Índices para checkins
    console.log('   Creando índices...');
    try {
      await db.execute(`CREATE INDEX IF NOT EXISTS idx_checkins_reserva_id ON checkins(reserva_id)`);
      await db.execute(`CREATE INDEX IF NOT EXISTS idx_checkins_usuario_id ON checkins(usuario_id)`);
      console.log('   ✅ Índices creados');
    } catch (e) {
      console.log('   ℹ️ Índices ya existen');
    }

    // RN-12: Notificaciones
    console.log('\n5️⃣ Creando tabla notificaciones...');
    await db.execute(`
      CREATE TABLE IF NOT EXISTS notificaciones (
        id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
        usuario_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        tipo VARCHAR(50) NOT NULL,
        titulo VARCHAR(255) NOT NULL,
        contenido TEXT,
        leida BOOLEAN DEFAULT false,
        datos_json TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT now()
      )
    `);
    console.log('   ✅ OK');

    // Índices para notificaciones
    console.log('   Creando índices...');
    try {
      await db.execute(`CREATE INDEX IF NOT EXISTS idx_notificaciones_usuario_id ON notificaciones(usuario_id)`);
      await db.execute(`CREATE INDEX IF NOT EXISTS idx_notificaciones_leida ON notificaciones(leida)`);
      console.log('   ✅ Índices creados');
    } catch (e) {
      console.log('   ℹ️ Índices ya existen');
    }

    // RN-15: Auditoría
    console.log('\n6️⃣ Creando tabla audit_logs...');
    await db.execute(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
        usuario_id VARCHAR(36) REFERENCES users(id) ON DELETE SET NULL,
        accion VARCHAR(50) NOT NULL,
        entidad VARCHAR(50),
        entidad_id VARCHAR(36),
        detalles TEXT,
        ip_address VARCHAR(45),
        created_at TIMESTAMP NOT NULL DEFAULT now()
      )
    `);
    console.log('   ✅ OK');

    // Índices para audit_logs
    console.log('   Creando índices...');
    try {
      await db.execute(`CREATE INDEX IF NOT EXISTS idx_audit_logs_usuario_id ON audit_logs(usuario_id)`);
      await db.execute(`CREATE INDEX IF NOT EXISTS idx_audit_logs_entidad ON audit_logs(entidad, entidad_id)`);
      await db.execute(`CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC)`);
      console.log('   ✅ Índices creados');
    } catch (e) {
      console.log('   ℹ️ Índices ya existen');
    }

    // RN-06: Calificaciones
    console.log('\n7️⃣ Creando tabla calificaciones...');
    await db.execute(`
      CREATE TABLE IF NOT EXISTS calificaciones (
        id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
        reserva_id VARCHAR(36) NOT NULL UNIQUE REFERENCES reservas(id) ON DELETE CASCADE,
        usuario_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        puntuacion INTEGER NOT NULL CHECK (puntuacion >= 1 AND puntuacion <= 5),
        comentario TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT now()
      )
    `);
    console.log('   ✅ OK');

    // Índices para calificaciones
    console.log('   Creando índices...');
    try {
      await db.execute(`CREATE INDEX IF NOT EXISTS idx_calificaciones_reserva_id ON calificaciones(reserva_id)`);
      await db.execute(`CREATE INDEX IF NOT EXISTS idx_calificaciones_usuario_id ON calificaciones(usuario_id)`);
      console.log('   ✅ Índices creados');
    } catch (e) {
      console.log('   ℹ️ Índices ya existen');
    }

    console.log('\n✅✅✅ Todas las migraciones completadas exitosamente ✅✅✅');
    process.exit(0);
  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

applyMigrations();
