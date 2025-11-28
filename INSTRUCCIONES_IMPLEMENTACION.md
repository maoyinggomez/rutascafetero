# 🔧 INSTRUCCIONES DE IMPLEMENTACIÓN

## Pasos para Aplicar Cambios

### 1. Revisar Cambios Realizados

Los cambios están en estos archivos:

```
✅ shared/schema.ts
   - Agregadas 4 nuevas tablas (audit_logs, notificaciones, checkins, calificaciones)
   - Agregados 2 nuevos enums
   - Extendidas tablas users y reservas

✅ server/storage.ts
   - Agregados 13 nuevos métodos
   - Actualizado interface IStorage
   - Mejorado método cancelarReserva()

✅ server/routes.ts
   - Agregados 9 nuevos endpoints
   - Agregado middleware checkNotSuspended()
   - Mejorado endpoint POST /api/reservas

✅ migrations/add_rn_features.sql
   - Script SQL para crear tablas
   - Script SQL para alterar tablas existentes
   - Índices para optimización
```

### 2. Ejecutar Migración de Base de Datos

```bash
# Conectarse a PostgreSQL
psql -U usuario -d rutascafetero -f migrations/add_rn_features.sql

# O manualmente:
psql -U usuario -d rutascafetero
# Luego en psql:
\i migrations/add_rn_features.sql
```

### 3. Verificar Cambios en TypeScript

```bash
cd c:\Users\maoyi\OneDrive\Pictures\rutascafetero

# Verificar que compila
npx tsx server/storage.ts

# Verificar schema
npx tsx shared/schema.ts
```

### 4. Reiniciar Servidor

```bash
# Opción 1: Desarrollo
npm run dev

# Opción 2: Con tsx
node -r tsx/cjs server/index.ts

# Opción 3: PowerShell
$env:NODE_ENV="development"; `
$env:PORT="3000"; `
$env:HOST="localhost"; `
node -r tsx/cjs server/index.ts
```

### 5. Probar Nuevos Endpoints

```bash
# Obtener token (como admin)
TOKEN=$(curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password"}' \
  | jq -r '.token')

# Probar crear notificación
curl -X GET http://localhost:3000/api/notificaciones \
  -H "Authorization: Bearer $TOKEN"

# Probar obtener logs
curl -X GET "http://localhost:3000/api/admin/audit-logs?accion=crear" \
  -H "Authorization: Bearer $TOKEN"
```

---

## 📋 Checklist de Verificación

- [ ] Base de datos actualizada
- [ ] No hay errores de compilación
- [ ] Servidor inicia sin errores
- [ ] Token de autenticación funciona
- [ ] Endpoints de notificaciones funcionan
- [ ] Endpoints de admin funcionan
- [ ] Endpoints de check-in funcionan
- [ ] Endpoints de calificación funcionan
- [ ] Logs de auditoría se registran
- [ ] Notificaciones se crean automáticamente

---

## 🐛 Troubleshooting

### Error: "DATABASE_URL must be set"
```bash
# Verificar .env
cat .env

# O configurar:
export DATABASE_URL="postgresql://user:pass@localhost:5432/rutascafetero"
```

### Error: "relation ... does not exist"
```bash
# La migración no se ejecutó
psql -U usuario -d rutascafetero -f migrations/add_rn_features.sql
```

### Error: "Cannot find module ..."
```bash
# Reinstalar dependencias
npm install

# O actualizar
npm update
```

### TypeError en storage
```bash
# Limpiar caché de TypeScript
rm -rf .cache node_modules/.cache

# Reinstalar
npm install
```

---

## 📊 Validación de Cambios

### Verificar tablas creadas
```sql
-- En PostgreSQL
\dt+ audit_logs
\dt+ notificaciones
\dt+ checkins
\dt+ calificaciones
```

### Verificar columnas agregadas
```sql
\d users
\d reservas
```

### Contar registros
```sql
SELECT COUNT(*) FROM audit_logs;
SELECT COUNT(*) FROM notificaciones;
SELECT COUNT(*) FROM checkins;
SELECT COUNT(*) FROM calificaciones;
```

---

## 🔄 Reversión (Si es necesario)

```sql
-- Remover tablas nuevas
DROP TABLE IF EXISTS calificaciones CASCADE;
DROP TABLE IF EXISTS checkins CASCADE;
DROP TABLE IF EXISTS notificaciones CASCADE;
DROP TABLE IF EXISTS audit_logs CASCADE;

-- Remover columnas de users
ALTER TABLE users DROP COLUMN IF EXISTS rol_validado;
ALTER TABLE users DROP COLUMN IF EXISTS suspendido;
ALTER TABLE users DROP COLUMN IF EXISTS motivo_suspension;
ALTER TABLE users DROP COLUMN IF EXISTS fecha_suspension;
ALTER TABLE users DROP COLUMN IF EXISTS telefono;
ALTER TABLE users DROP COLUMN IF EXISTS direccion;
ALTER TABLE users DROP COLUMN IF EXISTS ciudad;

-- Remover columnas de reservas
ALTER TABLE reservas DROP COLUMN IF EXISTS precio_por_persona_al_momento;
ALTER TABLE reservas DROP COLUMN IF EXISTS cerrada_auto;
```

---

## 📝 Logs de Cambios por Archivo

### shared/schema.ts
- Líneas agregadas: ~150
- Nuevas tablas: 4
- Nuevos enums: 2
- Nuevos tipos: 4

### server/storage.ts
- Líneas agregadas: ~300
- Nuevos métodos: 13
- Métodos mejorados: 2

### server/routes.ts
- Líneas agregadas: ~350
- Nuevos endpoints: 9
- Nuevas funciones: 1

### migrations/add_rn_features.sql
- Líneas: ~100
- Nuevas tablas: 4
- Alteraciones de tabla: 2

---

## 🚀 Próximos Pasos (Opcional)

1. **Implementar cierre automático de reservas**
   - Agregar job/cron que cierre reservas vencidas
   - Cambiar estado a "cerrada"

2. **Implementar privacidad en cliente**
   - Filtrar datos personales según visibilidad
   - Mostrar solo lo permitido

3. **Agregar panel de admin**
   - Dashboard de auditoría
   - Gestión de usuarios
   - Gestión de rutas

4. **Implementar recuperación de contraseña**
   - Endpoint POST /api/auth/forgot-password
   - Endpoint POST /api/auth/reset-password

5. **Agregar caché de notificaciones**
   - Redis para mejorar rendimiento
   - Prefetch de notificaciones

---

## ✅ Confirmación de Implementación

Después de completar todos los pasos:

1. Crear usuario de prueba
2. Crear reserva
3. Confirmar reserva
4. Verificar notificación creada
5. Verificar log de auditoría
6. Calificar
7. Hacer check-in
8. Suspender usuario
9. Verificar que no puede actuar
10. Restaurar usuario

Si todo funciona → **¡Implementación Completada! ✅**

---

## 📞 Soporte

Para errores o preguntas:

1. Revisar `RESUMEN_CAMBIOS.md`
2. Revisar `IMPLEMENTACION_RN_07_15.md`
3. Revisar `GUIA_ENDPOINTS.md`
4. Verificar logs: `console.log()` en navegador/terminal

---

## 📄 Documentación Relacionada

- `IMPLEMENTACION_RN_07_15.md` - Documentación técnica completa
- `RESUMEN_CAMBIOS.md` - Resumen ejecutivo
- `GUIA_ENDPOINTS.md` - Ejemplos de uso de endpoints
- `AUDIT_RN_05_16.js` - Auditoría de requerimientos (original)

---

**Última actualización**: 28 de Noviembre de 2025
**Status**: ✅ Completado
**Versión**: 1.0
