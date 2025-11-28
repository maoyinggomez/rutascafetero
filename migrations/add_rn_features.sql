-- Migración para agregar características faltantes RN-07 a RN-15

-- RN-11: Agregar campos de moderación a users
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS rol_validado BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS suspendido BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS motivo_suspension TEXT,
ADD COLUMN IF NOT EXISTS fecha_suspension TIMESTAMP;

-- RN-10: Agregar datos personales a users
ALTER TABLE users
ADD COLUMN IF NOT EXISTS telefono TEXT,
ADD COLUMN IF NOT EXISTS direccion TEXT,
ADD COLUMN IF NOT EXISTS ciudad TEXT;

-- RN-05 y RN-08: Mejorar reservas
ALTER TABLE reservas
ADD COLUMN IF NOT EXISTS precio_por_persona_al_momento INTEGER,
ADD COLUMN IF NOT EXISTS cerrada_auto BOOLEAN DEFAULT false;

-- Actualizar enum de estado_reserva para incluir 'cerrada'
-- (esto generalmente se hace mediante Drizzle migrations, pero agregamos aquí)

-- RN-09: Crear tabla de check-ins
CREATE TABLE IF NOT EXISTS checkins (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  reserva_id VARCHAR(36) NOT NULL REFERENCES reservas(id) ON DELETE CASCADE,
  usuario_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  fecha_hora TIMESTAMP NOT NULL DEFAULT now(),
  ubicacion TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_checkins_reserva_id ON checkins(reserva_id);
CREATE INDEX IF NOT EXISTS idx_checkins_usuario_id ON checkins(usuario_id);

-- RN-12: Crear tabla de notificaciones
CREATE TABLE IF NOT EXISTS notificaciones (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  usuario_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tipo VARCHAR(50) NOT NULL,
  titulo VARCHAR(255) NOT NULL,
  contenido TEXT,
  leida BOOLEAN DEFAULT false,
  datos_json TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notificaciones_usuario_id ON notificaciones(usuario_id);
CREATE INDEX IF NOT EXISTS idx_notificaciones_leida ON notificaciones(leida);

-- RN-15: Crear tabla de auditoría
CREATE TABLE IF NOT EXISTS audit_logs (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  usuario_id VARCHAR(36) REFERENCES users(id) ON DELETE SET NULL,
  accion VARCHAR(50) NOT NULL,
  entidad VARCHAR(50),
  entidad_id VARCHAR(36),
  detalles TEXT,
  ip_address VARCHAR(45),
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_usuario_id ON audit_logs(usuario_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entidad ON audit_logs(entidad, entidad_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- RN-06: Crear tabla de calificaciones
CREATE TABLE IF NOT EXISTS calificaciones (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  reserva_id VARCHAR(36) NOT NULL UNIQUE REFERENCES reservas(id) ON DELETE CASCADE,
  usuario_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  puntuacion INTEGER NOT NULL CHECK (puntuacion >= 1 AND puntuacion <= 5),
  comentario TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_calificaciones_reserva_id ON calificaciones(reserva_id);
CREATE INDEX IF NOT EXISTS idx_calificaciones_usuario_id ON calificaciones(usuario_id);
