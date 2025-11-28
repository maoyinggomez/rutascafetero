# 🚀 Guía Rápida - Nuevos Endpoints

## 📲 Notificaciones

### Obtener todas las notificaciones
```http
GET /api/notificaciones
Authorization: Bearer {token}
```

**Respuesta:**
```json
[
  {
    "id": "uuid",
    "usuarioId": "uuid",
    "tipo": "reserva_confirmada",
    "titulo": "¡Tu reserva ha sido confirmada!",
    "contenido": "Tu reserva ha sido aceptada",
    "leida": false,
    "datosJson": "{...}",
    "createdAt": "2025-11-28T10:30:00Z"
  }
]
```

### Marcar notificación como leída
```http
PATCH /api/notificaciones/{notificationId}/leer
Authorization: Bearer {token}
```

---

## ✅ Check-in

### Registrar check-in
```http
POST /api/reservas/{reservaId}/checkin
Authorization: Bearer {token}
Content-Type: application/json

{
  "ubicacion": "Entrada principal"
}
```

**Respuesta:**
```json
{
  "id": "uuid",
  "reservaId": "uuid",
  "usuarioId": "uuid",
  "fechaHora": "2025-11-28T14:00:00Z",
  "ubicacion": "Entrada principal",
  "createdAt": "2025-11-28T14:00:00Z"
}
```

### Obtener check-ins de una reserva
```http
GET /api/reservas/{reservaId}/checkins
Authorization: Bearer {token}
```

---

## ⭐ Calificaciones

### Calificar una ruta
```http
POST /api/reservas/{reservaId}/calificar
Authorization: Bearer {token}
Content-Type: application/json

{
  "puntuacion": 5,
  "comentario": "¡Excelente experiencia!"
}
```

**Respuesta:**
```json
{
  "id": "uuid",
  "reservaId": "uuid",
  "usuarioId": "uuid",
  "puntuacion": 5,
  "comentario": "¡Excelente experiencia!",
  "createdAt": "2025-11-28T15:00:00Z"
}
```

---

## 🔐 Administración - Usuarios

### Suspender usuario
```http
PUT /api/admin/usuarios/{userId}/suspender
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "motivo": "Violación de términos de servicio"
}
```

**Respuesta:**
```json
{
  "message": "Usuario suspendido exitosamente",
  "usuario": {
    "id": "uuid",
    "suspendido": true,
    "motivoSuspension": "Violación de términos de servicio",
    "fechaSuspension": "2025-11-28T10:00:00Z",
    ...
  }
}
```

### Restaurar usuario
```http
PUT /api/admin/usuarios/{userId}/restaurar
Authorization: Bearer {admin_token}
```

**Respuesta:**
```json
{
  "message": "Usuario restaurado exitosamente",
  "usuario": {
    "id": "uuid",
    "suspendido": false,
    "motivoSuspension": null,
    "fechaSuspension": null,
    ...
  }
}
```

### Validar rol de usuario
```http
PUT /api/admin/usuarios/{userId}/validar-rol
Authorization: Bearer {admin_token}
```

**Respuesta:**
```json
{
  "message": "Rol validado exitosamente",
  "usuario": {
    "id": "uuid",
    "rol": "anfitrion",
    "rolValidado": true,
    ...
  }
}
```

---

## 🛑 Administración - Rutas

### Ocultar ruta
```http
PUT /api/admin/rutas/{rutaId}/ocultar
Authorization: Bearer {admin_token}
```

**Respuesta:**
```json
{
  "message": "Ruta ocultada exitosamente",
  "ruta": {
    "id": "uuid",
    "estado": "OCULTA",
    ...
  }
}
```

---

## 📊 Auditoría

### Obtener logs de auditoría
```http
GET /api/admin/audit-logs?usuarioId=xxx&accion=crear&entidad=reserva&desde=2025-11-01&hasta=2025-11-28
Authorization: Bearer {admin_token}
```

**Parámetros opcionales:**
- `usuarioId`: Filtrar por usuario
- `accion`: Filtrar por acción (crear, actualizar, eliminar, cambiar_estado, suspender, validar_rol, calificar, checkin)
- `entidad`: Filtrar por entidad (usuario, ruta, reserva)
- `desde`: Fecha de inicio (ISO 8601)
- `hasta`: Fecha de fin (ISO 8601)

**Respuesta:**
```json
[
  {
    "id": "uuid",
    "usuarioId": "uuid",
    "accion": "crear",
    "entidad": "reserva",
    "entidadId": "uuid",
    "detalles": "{\"rutaId\": \"...\", \"cantidadPersonas\": 2}",
    "ipAddress": "192.168.1.100",
    "createdAt": "2025-11-28T10:00:00Z"
  }
]
```

---

## 🔄 Flujos Completos

### Flujo de Reserva

1. **Turista crea reserva**
   ```
   POST /api/reservas
   ```
   - Evento: Anfitrión recibe notificación de nueva reserva

2. **Anfitrión confirma reserva**
   ```
   PATCH /api/reservas/{id}
   {"estado": "confirmada"}
   ```
   - Evento: Turista recibe notificación de confirmación
   - Se registra en auditoría

3. **En el día de la ruta: Anfitrión hace check-in**
   ```
   POST /api/reservas/{id}/checkin
   ```
   - Se registra asistencia
   - Se registra en auditoría

4. **Después: Turista califica**
   ```
   POST /api/reservas/{id}/calificar
   {"puntuacion": 5, "comentario": "..."}
   ```
   - Se registra en auditoría
   - Se actualiza rating de la ruta

---

## 🚫 Errores Comunes

| Error | Causa | Solución |
|-------|-------|----------|
| 403 Forbidden | Usuario suspendido | Admin debe restaurar usuario |
| 400 Bad Request | Check-in en reserva no confirmada | Confirmar reserva primero |
| 400 Bad Request | Puntuación fuera de rango | Usar 1-5 |
| 404 Not Found | Reserva no encontrada | Verificar ID |
| 401 Unauthorized | Token inválido/expirado | Obtener nuevo token |

---

## 💡 Tips

- Las notificaciones se ordenan por fecha descendente (más nuevas primero)
- Solo admin puede acceder a `/api/admin/*`
- Los logs de auditoría incluyen IP del cliente
- Un usuario suspendido recibe notificación automática
- Los roles se validan una sola vez por usuario

---

## 📝 Ejemplo: Ciclo Completo

```javascript
// 1. Usuario se registra (rol: turista por defecto)
POST /api/auth/register

// 2. Crea reserva
POST /api/reservas
// → Notificación al anfitrión

// 3. Anfitrión confirma
PATCH /api/reservas/{id}
// → Notificación al turista

// 4. Turista consulta notificaciones
GET /api/notificaciones
// → Ve notificación de confirmación

// 5. Turista marca como leída
PATCH /api/notificaciones/{id}/leer

// 6. Día de la ruta: Anfitrión hace check-in
POST /api/reservas/{id}/checkin

// 7. Turista califica
POST /api/reservas/{id}/calificar

// 8. Admin revisa auditoría
GET /api/admin/audit-logs
// → Ve todas las acciones
```

---

## 🔗 Relaciones de Datos

```
Usuario (1) ---> (N) Reservas
User (1) ---> (N) Notificaciones
User (1) ---> (N) Audit Logs
Reserva (1) ---> (N) Check-ins
Reserva (1) ---> (1) Calificación
Ruta (1) ---> (N) Reservas
```
