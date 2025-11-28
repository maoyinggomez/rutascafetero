# 🔗 URLs para Confirmar Implementación

## Base URL
```
http://localhost:3000
```

---

## 📲 Endpoints de Notificaciones

### 1. Obtener Notificaciones
```
GET http://localhost:3000/api/notificaciones
Authorization: Bearer {token}
```

### 2. Marcar Notificación como Leída
```
PATCH http://localhost:3000/api/notificaciones/{notificationId}/leer
Authorization: Bearer {token}
```

---

## ✅ Endpoints de Check-in

### 3. Registrar Check-in
```
POST http://localhost:3000/api/reservas/{reservaId}/checkin
Authorization: Bearer {token}
Content-Type: application/json

Body:
{
  "ubicacion": "Entrada principal"
}
```

### 4. Obtener Check-ins
```
GET http://localhost:3000/api/reservas/{reservaId}/checkins
Authorization: Bearer {token}
```

---

## ⭐ Endpoints de Calificaciones

### 5. Calificar Ruta
```
POST http://localhost:3000/api/reservas/{reservaId}/calificar
Authorization: Bearer {token}
Content-Type: application/json

Body:
{
  "puntuacion": 5,
  "comentario": "¡Excelente!"
}
```

---

## 🔐 Endpoints de Administración

### 6. Suspender Usuario
```
PUT http://localhost:3000/api/admin/usuarios/{userId}/suspender
Authorization: Bearer {admin_token}
Content-Type: application/json

Body:
{
  "motivo": "Violación de términos"
}
```

### 7. Restaurar Usuario
```
PUT http://localhost:3000/api/admin/usuarios/{userId}/restaurar
Authorization: Bearer {admin_token}
```

### 8. Ocultar Ruta
```
PUT http://localhost:3000/api/admin/rutas/{rutaId}/ocultar
Authorization: Bearer {admin_token}
```

### 9. Validar Rol de Usuario
```
PUT http://localhost:3000/api/admin/usuarios/{userId}/validar-rol
Authorization: Bearer {admin_token}
```

### 10. Obtener Logs de Auditoría
```
GET http://localhost:3000/api/admin/audit-logs
Authorization: Bearer {admin_token}

Query Parameters (opcionales):
- usuarioId={userId}
- accion=crear|actualizar|eliminar|cambiar_estado|suspender|validar_rol|calificar|checkin
- entidad=usuario|ruta|reserva
- desde=2025-11-01T00:00:00Z
- hasta=2025-11-28T23:59:59Z

Ejemplo:
GET http://localhost:3000/api/admin/audit-logs?accion=crear&entidad=reserva
```

---

## 🧪 Flujo de Prueba Completo

### Paso 1: Obtener Token
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "turista@example.com",
    "password": "password123"
  }'
```

**Respuesta:**
```json
{
  "user": {...},
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

### Paso 2: Crear Reserva
```bash
TOKEN="tu_token_aqui"
curl -X POST http://localhost:3000/api/reservas \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "rutaId": "ruta-uuid",
    "fechaRuta": "2025-12-15T09:00:00Z",
    "cantidadPersonas": 2,
    "totalPagado": 100000
  }'
```

### Paso 3: Obtener Notificaciones
```bash
curl -X GET http://localhost:3000/api/notificaciones \
  -H "Authorization: Bearer $TOKEN"
```

**Respuesta:**
```json
[
  {
    "id": "notif-uuid",
    "usuarioId": "user-uuid",
    "tipo": "reserva_creada",
    "titulo": "Nueva reserva en tu ruta",
    "contenido": "Se ha creado una nueva reserva...",
    "leida": false,
    "createdAt": "2025-11-28T10:00:00Z"
  }
]
```

### Paso 4: Marcar Notificación como Leída
```bash
NOTIF_ID="notif-uuid"
curl -X PATCH http://localhost:3000/api/notificaciones/$NOTIF_ID/leer \
  -H "Authorization: Bearer $TOKEN"
```

### Paso 5: Hacer Check-in
```bash
RESERVA_ID="reserva-uuid"
curl -X POST http://localhost:3000/api/reservas/$RESERVA_ID/checkin \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "ubicacion": "Entrada principal"
  }'
```

### Paso 6: Calificar
```bash
curl -X POST http://localhost:3000/api/reservas/$RESERVA_ID/calificar \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "puntuacion": 5,
    "comentario": "¡Excelente experiencia!"
  }'
```

### Paso 7: Ver Logs de Auditoría (Admin)
```bash
ADMIN_TOKEN="admin_token_aqui"
curl -X GET "http://localhost:3000/api/admin/audit-logs?accion=crear&entidad=reserva" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

**Respuesta:**
```json
[
  {
    "id": "audit-uuid",
    "usuarioId": "user-uuid",
    "accion": "crear",
    "entidad": "reserva",
    "entidadId": "reserva-uuid",
    "detalles": "{\"rutaId\": \"...\", \"cantidadPersonas\": 2}",
    "ipAddress": "127.0.0.1",
    "createdAt": "2025-11-28T10:00:00Z"
  }
]
```

---

## ✨ Resumen de URLs

| # | Método | URL | Auth |
|----|--------|-----|------|
| 1 | GET | `/api/notificaciones` | User |
| 2 | PATCH | `/api/notificaciones/:id/leer` | User |
| 3 | POST | `/api/reservas/:id/checkin` | Anfitrión |
| 4 | GET | `/api/reservas/:id/checkins` | User |
| 5 | POST | `/api/reservas/:id/calificar` | User |
| 6 | PUT | `/api/admin/usuarios/:id/suspender` | Admin |
| 7 | PUT | `/api/admin/usuarios/:id/restaurar` | Admin |
| 8 | PUT | `/api/admin/rutas/:id/ocultar` | Admin |
| 9 | PUT | `/api/admin/usuarios/:id/validar-rol` | Admin |
| 10 | GET | `/api/admin/audit-logs` | Admin |

---

## 🚀 Verificación Rápida

Ejecuta en terminal:

```bash
# 1. Verificar que el servidor esté corriendo
curl http://localhost:3000/api/auth/me

# 2. Verificar endpoints nuevos (sin auth dará 401, pero eso es correcto)
curl http://localhost:3000/api/notificaciones
curl http://localhost:3000/api/admin/audit-logs

# 3. Si ambas devuelven {"error": "No autorizado"} → ¡Todo está bien! ✅
```

---

## 📝 Notas

- Todos los endpoints requieren autenticación (excepto registro y login)
- Admin necesita rol `admin` para acceder a endpoints `/api/admin/*`
- Los IDs deben reemplazarse con valores reales de tu BD
- Las fechas deben estar en formato ISO 8601

---

**Status**: ✅ Implementación Completa
**Total de URLs**: 10 nuevos endpoints
