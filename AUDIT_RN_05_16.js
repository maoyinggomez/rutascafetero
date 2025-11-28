/**
 * AUDITORÍA DE REGLAS DE NEGOCIO RN-05 A RN-16
 * 
 * Análisis detallado del cumplimiento de cada regla
 */

const audit = {
  "RN-05: Cálculo de costos": {
    estado: "⚠️ PARCIAL",
    hallazgo: "El campo 'totalPagado' se almacena en la reserva, pero falta validar que sea inmutable",
    campos_necesarios: ["totalPagado (existe)", "precioFijo (timestamp para auditoria)"],
    acciones: [
      "✅ Campo totalPagado existe en reservas",
      "❌ Falta: No hay validación de que el precio no cambie",
      "❌ Falta: No hay registro de cuándo se congeló el precio",
      "❌ Falta: Necesita vincular precio_por_persona al momento de reserva"
    ]
  },

  "RN-06: Calificaciones": {
    estado: "❌ NO IMPLEMENTADA",
    hallazgo: "Tabla calificaciones no existe",
    campos_necesarios: [
      "calificaciones table: id, reservaId, userId, puntuacion, comentario, createdAt",
      "rutas.rating debe actualizarse automáticamente",
      "rutas.resenas debe incrementarse"
    ],
    acciones: [
      "❌ Falta tabla calificaciones",
      "❌ Falta endpoint POST /api/reservas/:id/calificar",
      "❌ Falta validación: solo turista de la reserva puede calificar",
      "❌ Falta validación: reserva debe estar CERRADA",
      "❌ Falta: una sola calificación por reserva"
    ]
  },

  "RN-07: Cancelaciones": {
    estado: "⚠️ PARCIAL",
    hallazgo: "Existe cancelación pero falta validar fecha y liberar cupos",
    campos_necesarios: ["reservas.estado ya soporta cancelada"],
    acciones: [
      "✅ Endpoint DELETE /api/reservas/:id existe",
      "✅ Control de permisos para turista",
      "❌ Falta: Validar que fecha no haya pasado",
      "❌ Falta: Liberar cupo cuando se cancela",
      "❌ Falta: Prohibir cancelación si está CERRADA o en progreso",
      "❌ Falta: Requiere 'causa justificada' para anfitrión/guía"
    ]
  },

  "RN-08: Validación de fechas": {
    estado: "⚠️ PARCIAL",
    hallazgo: "Hay validación básica pero falta cierre automático",
    campos_necesarios: ["reservas.fechaRuta validada", "rutas.fechaInicio/fechaFin"],
    acciones: [
      "✅ Schema valida que fechaRuta sea válida",
      "❌ Falta: Prohibir fechas pasadas en POST /api/reservas",
      "❌ Falta: Prohibir fechas pasadas en POST /api/rutas",
      "❌ Falta: Cierre automático de reservas vencidas",
      "❌ Falta: Job/Cron para cerrar automáticamente"
    ]
  },

  "RN-09: Check-in/Asistencia": {
    estado: "❌ NO IMPLEMENTADA",
    hallazgo: "No existe funcionalidad de check-in",
    campos_necesarios: [
      "checkins table: id, reservaId, usuarioId, fechaHora, ubicacion, estado",
      "Endpoint POST /api/reservas/:id/checkin"
    ],
    acciones: [
      "❌ Falta tabla checkins",
      "❌ Falta endpoint POST /api/reservas/:id/checkin",
      "❌ Falta validación: reserva debe estar CONFIRMADA",
      "❌ Falta: solo anfitrión/guía puede hacer check-in",
      "❌ Falta: registrar fecha/hora/usuario"
    ]
  },

  "RN-10: Privacidad": {
    estado: "❌ NO IMPLEMENTADA",
    hallazgo: "No hay control de visibilidad de datos personales",
    campos_necesarios: ["usuarios.datosPersonales (teléfono, dirección)"],
    acciones: [
      "❌ Falta: Datos personales en tabla users",
      "❌ Falta: Lógica de visibilidad en endpoints GET",
      "❌ Falta: Solo mostrar datos si confirmado entre turista-anfitrión",
      "❌ Falta: Visitantes no autenticados solo ven datos públicos"
    ]
  },

  "RN-11: Moderación": {
    estado: "⚠️ PARCIAL",
    hallazgo: "Faltan capacidades de Admin para suspender y auditar",
    campos_necesarios: ["users.suspendido", "users.motivoSuspension", "auditLogs table"],
    acciones: [
      "❌ Falta: Campo suspendido en users",
      "❌ Falta: Endpoint PUT /api/admin/usuarios/:id/suspender",
      "❌ Falta: Endpoint PUT /api/admin/rutas/:id/ocultar",
      "❌ Falta: Tabla auditLogs para registro de acciones",
      "❌ Falta: Validar en endpoints si usuario está suspendido"
    ]
  },

  "RN-12: Notificaciones": {
    estado: "❌ NO IMPLEMENTADA",
    hallazgo: "No existe sistema de notificaciones",
    campos_necesarios: ["notificaciones table: id, userId, tipo, contenido, leida"],
    acciones: [
      "❌ Falta tabla notificaciones",
      "❌ Falta endpoint GET /api/notificaciones",
      "❌ Falta endpoint PATCH /api/notificaciones/:id/leer",
      "❌ Falta: Generar notificación en crear/aceptar/rechazar/cancelar",
      "❌ Falta: No incluir datos sensibles en notificaciones"
    ]
  },

  "RN-13: Integridad datos": {
    estado: "❌ NO IMPLEMENTADA",
    hallazgo: "No valida integridad referencial",
    campos_necesarios: [],
    acciones: [
      "❌ Falta: No permitir DELETE ruta si tiene reservas activas",
      "❌ Falta: Si anfitrión se elimina, ocultar sus rutas automáticamente",
      "❌ Falta: Validar en DELETE /api/rutas/:id"
    ]
  },

  "RN-14: Política roles": {
    estado: "⚠️ PARCIAL",
    hallazgo: "Roles existen pero falta validación por Admin",
    campos_necesarios: ["users.rolValidado (boolean)", "users.solicitudRolEnPendiente"],
    acciones: [
      "✅ Roles existen: turista, anfitrion, guia, admin",
      "✅ Default: turista",
      "❌ Falta: Campo rolValidado para anfitriones/guías",
      "❌ Falta: Endpoint POST /api/admin/usuarios/:id/validar-rol",
      "❌ Falta: Validar que usuario no tenga múltiples roles"
    ]
  },

  "RN-15: Auditoría": {
    estado: "❌ NO IMPLEMENTADA",
    hallazgo: "No existe tabla de auditoría",
    campos_necesarios: ["auditLogs table: id, userId, accion, entidad, entidadId, detalles, timestamp"],
    acciones: [
      "❌ Falta tabla auditLogs",
      "❌ Falta registrar: crear/editar/eliminar rutas",
      "❌ Falta registrar: crear/aceptar/rechazar/cancelar reservas",
      "❌ Falta registrar: calificaciones",
      "❌ Falta registrar: suspensiones/restauraciones"
    ]
  },

  "RN-16: Estados experiencia": {
    estado: "✅ IMPLEMENTADA",
    hallazgo: "Los estados de ruta ya están implementados",
    campos_necesarios: ["rutas.estado con valores BORRADOR/PUBLICADA/OCULTA/ELIMINADA"],
    acciones: [
      "✅ Enum estadoRutaEnum existe",
      "✅ Campo estado en tabla rutas",
      "✅ Default: BORRADOR",
      "⚠️ Falta: Validar visibilidad según estado en GET /api/rutas"
    ]
  }
};

console.log("=== AUDITORÍA DE REGLAS DE NEGOCIO RN-05 A RN-16 ===\n");

let totalReglas = Object.keys(audit).length;
let implementadas = 0;
let parciales = 0;
let noImplementadas = 0;

Object.entries(audit).forEach(([regla, datos]) => {
  console.log(`${regla}`);
  console.log(`Estado: ${datos.estado}`);
  console.log(`${datos.hallazgo}\n`);
  
  if (datos.estado.includes("✅")) implementadas++;
  if (datos.estado.includes("⚠️")) parciales++;
  if (datos.estado.includes("❌")) noImplementadas++;
});

console.log("\n=== RESUMEN ===");
console.log(`Total reglas: ${totalReglas}`);
console.log(`✅ Implementadas: ${implementadas}`);
console.log(`⚠️ Parciales: ${parciales}`);
console.log(`❌ No implementadas: ${noImplementadas}`);
console.log(`\nTasa de cumplimiento: ${Math.round((implementadas / totalReglas) * 100)}%`);
