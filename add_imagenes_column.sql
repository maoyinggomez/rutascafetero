-- Agregar columna imagenes a la tabla rutas si no existe
ALTER TABLE rutas ADD COLUMN IF NOT EXISTS imagenes text[] DEFAULT ARRAY[]::text[];

-- Hacer que imagenUrl sea nullable
ALTER TABLE rutas ALTER COLUMN imagen_url DROP NOT NULL;
