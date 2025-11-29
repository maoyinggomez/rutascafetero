-- Migración: Cambiar duracionHoras a duracionMinutos
-- Este script cambia la estructura de la tabla rutas de duracionHoras (integer) a duracionMinutos (integer)

-- 1. Crear columna temporal duracionMinutos si no existe
ALTER TABLE rutas 
ADD COLUMN IF NOT EXISTS duracion_minutos_temp INTEGER;

-- 2. Convertir datos de duracionHoras a minutos (suponiendo que duracionHoras es en horas)
UPDATE rutas 
SET duracion_minutos_temp = COALESCE(CAST(duracion_horas AS INTEGER) * 60, 5)
WHERE duracion_horas IS NOT NULL;

-- Si hay NULL, establecer un valor por defecto
UPDATE rutas 
SET duracion_minutos_temp = 5
WHERE duracion_minutos_temp IS NULL;

-- 3. Dropear columna antigua
ALTER TABLE rutas 
DROP COLUMN IF EXISTS duracion_horas CASCADE;

-- 4. Renombrar columna temporal a duracion_minutos
ALTER TABLE rutas 
RENAME COLUMN duracion_minutos_temp TO duracion_minutos;

-- 5. Agregar constraint NOT NULL si no existe
ALTER TABLE rutas 
ALTER COLUMN duracion_minutos SET NOT NULL;

-- Verificar cambios
SELECT id, nombre, duracion_minutos FROM rutas LIMIT 5;
