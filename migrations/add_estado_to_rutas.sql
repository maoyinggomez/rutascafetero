-- Crear enum para estados de rutas si no existe
DO $$ BEGIN
  CREATE TYPE estado_ruta AS ENUM ('BORRADOR', 'PUBLICADA', 'OCULTA', 'ELIMINADA');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Agregar columna estado a la tabla rutas
ALTER TABLE rutas
ADD COLUMN IF NOT EXISTS estado estado_ruta NOT NULL DEFAULT 'BORRADOR';

-- Comentario explicativo
COMMENT ON COLUMN rutas.estado IS 'Estado de la ruta: BORRADOR (borrador), PUBLICADA (publicada), OCULTA (oculta), ELIMINADA (eliminada)';
