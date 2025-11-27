-- Agregar columnas faltantes a la tabla rutas
ALTER TABLE rutas ADD COLUMN IF NOT EXISTS dificultad dificultad DEFAULT 'Fácil';
ALTER TABLE rutas ADD COLUMN IF NOT EXISTS duracion_horas integer DEFAULT 1;
ALTER TABLE rutas ADD COLUMN IF NOT EXISTS precio_por_persona integer DEFAULT 0;
ALTER TABLE rutas ADD COLUMN IF NOT EXISTS tags text[];
ALTER TABLE rutas ADD COLUMN IF NOT EXISTS puntos_interes text[];
ALTER TABLE rutas ADD COLUMN IF NOT EXISTS disponible boolean DEFAULT true;

-- Hacer imagen_url nullable
ALTER TABLE rutas ALTER COLUMN imagen_url DROP NOT NULL;

-- Agregar columnas faltantes a la tabla reservas
ALTER TABLE reservas ADD COLUMN IF NOT EXISTS fecha_ruta timestamp NOT NULL DEFAULT NOW();
ALTER TABLE reservas ADD COLUMN IF NOT EXISTS cantidad_personas integer DEFAULT 1;
ALTER TABLE reservas ADD COLUMN IF NOT EXISTS estado estado_reserva DEFAULT 'pendiente';
ALTER TABLE reservas ADD COLUMN IF NOT EXISTS total_pagado integer DEFAULT 0;
ALTER TABLE reservas ADD COLUMN IF NOT EXISTS created_at timestamp DEFAULT NOW();

-- Crear tipos enum si no existen
DO $$ BEGIN
  CREATE TYPE dificultad AS ENUM ('Fácil', 'Moderado', 'Avanzado');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE estado_reserva AS ENUM ('pendiente', 'confirmada', 'cancelada');
EXCEPTION WHEN duplicate_object THEN null;
END $$;
