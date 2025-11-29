import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, decimal, timestamp, pgEnum, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const roleEnum = pgEnum("role", ["turista", "anfitrion", "guia", "admin"]);
export const dificultadEnum = pgEnum("dificultad", ["Fácil", "Moderado", "Avanzado"]);
export const estadoRutaEnum = pgEnum("estado_ruta", ["BORRADOR", "PUBLICADA", "OCULTA", "ELIMINADA"]);
export const estadoReservaEnum = pgEnum("estado_reserva", ["pendiente", "confirmada", "cancelada", "cerrada"]);
export const tipoNotificacionEnum = pgEnum("tipo_notificacion", ["reserva_creada", "reserva_confirmada", "reserva_rechazada", "reserva_cancelada", "calificacion_recibida", "suspension", "rol_validado"]);
export const tipoAccionAuditEnum = pgEnum("tipo_accion_audit", ["crear", "actualizar", "eliminar", "cambiar_estado", "suspender", "validar_rol", "calificar", "checkin"]);

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  nombre: text("nombre").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  rol: roleEnum("rol").notNull().default("turista"),
  // RN-14: Validación de roles
  rolValidado: boolean("rol_validado").notNull().default(false),
  // RN-11: Moderación
  suspendido: boolean("suspendido").notNull().default(false),
  motivoSuspension: text("motivo_suspension"),
  fechaSuspension: timestamp("fecha_suspension"),
  // RN-10: Privacidad
  telefono: text("telefono"),
  direccion: text("direccion"),
  ciudad: text("ciudad"),
});

export const rutas = pgTable("rutas", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  nombre: text("nombre").notNull(),
  descripcion: text("descripcion").notNull(),
  destino: text("destino").notNull(),
  duracion: text("duracion").notNull(),
  precio: integer("precio").notNull(),
  imagenUrl: text("imagen_url"),
  imagenes: text("imagenes").array().default([]),
  cupoMaximo: integer("cupo_maximo").notNull().default(20),
  rating: decimal("rating", { precision: 2, scale: 1 }).notNull().default("4.5"),
  resenas: integer("resenas").notNull().default(0),
  anfitrionId: varchar("anfitrion_id").references(() => users.id),
  duracionMinutos: integer("duracion_minutos").notNull(),
  precioPorPersona: integer("precio_por_persona").notNull(),
  tags: text("tags").array(),
  puntosInteres: text("puntos_interes").array(),
  disponible: boolean("disponible").notNull().default(true),
  estado: estadoRutaEnum("estado").notNull().default("BORRADOR"),
});

export const reservas = pgTable("reservas", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  rutaId: varchar("ruta_id").notNull().references(() => rutas.id),
  fechaRuta: timestamp("fecha_ruta").notNull(),
  horaInicio: text("hora_inicio"),
  horaFin: text("hora_fin"),
  cantidadPersonas: integer("cantidad_personas").notNull(),
  estado: estadoReservaEnum("estado").notNull().default("pendiente"),
  totalPagado: integer("total_pagado").notNull(),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  // RN-05: Congelación de precio
  precioPorPersonaAlMomento: integer("precio_por_persona_al_momento"),
  // RN-08: Cierre automático
  cerradaAuto: boolean("cerrada_auto").notNull().default(false),
});

export const calificaciones = pgTable("calificaciones", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  reservaId: varchar("reserva_id").notNull().references(() => reservas.id),
  userId: varchar("user_id").references(() => users.id),
  rutaId: varchar("ruta_id").notNull().references(() => rutas.id),
  rating: integer("rating").notNull(),
  comentario: text("comentario"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
}).extend({
  adminCode: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
});

export const insertRutaSchema = createInsertSchema(rutas).omit({
  id: true,
  rating: true,
  resenas: true,
  disponible: true,
  estado: true,
}).extend({
  imagenUrl: z.string().optional(),
  imagenes: z.array(z.string()).optional().default([]),
  anfitrionId: z.string().optional(),
  duracionMinutos: z.number().int().min(5, "La duración mínima es 5 minutos"),
});

// Schema para crear reserva - acepta string o Date para fechaRuta y lo transforma a Date
export const insertReservaSchema = z.object({
  rutaId: z.string().min(1, "rutaId es requerido"),
  fechaRuta: z.union([z.string(), z.date()])
    .refine(val => {
      // Validar que sea una fecha válida
      const date = typeof val === 'string' ? new Date(val) : val;
      return !isNaN(date.getTime());
    }, "Fecha inválida")
    .refine(val => {
      // Validar que no sea una fecha pasada (permite hoy)
      const date = typeof val === 'string' ? new Date(val) : val;
      const now = new Date();
      // Comparar solo fechas (ignorar horas)
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const reservaDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      return reservaDate >= today;
    }, "No se permiten fechas pasadas")
    .transform(val => {
      // Convertir string a Date si es necesario
      if (typeof val === 'string') {
        return new Date(val);
      }
      return val;
    }),
  cantidadPersonas: z.number()
    .int("Cantidad de personas debe ser un número entero")
    .positive("Cantidad de personas debe ser mayor a 0"),
  totalPagado: z.number()
    .positive("Total pagado debe ser un número positivo")
    .transform(v => Math.round(v)),
  horaInicio: z.string().optional(),
  horaFin: z.string().optional(),
});

export const insertCalificacionSchema = createInsertSchema(calificaciones).omit({
  id: true,
  createdAt: true,
  userId: true,
}).extend({
  rating: z.number().min(1).max(5),
  comentario: z.string().optional(),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Ruta = typeof rutas.$inferSelect;
export type InsertRuta = z.infer<typeof insertRutaSchema>;
export type Reserva = typeof reservas.$inferSelect;
export type InsertReserva = z.infer<typeof insertReservaSchema>;

// Tipo extendido para insertar en la BD (incluye userId que viene del servidor)
export type InsertReservaDB = InsertReserva & { userId: string };

// RN-09: Check-in / Asistencia
export const checkins = pgTable("checkins", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  reservaId: varchar("reserva_id").notNull().references(() => reservas.id),
  usuarioId: varchar("usuario_id").notNull().references(() => users.id),
  fechaHora: timestamp("fecha_hora").notNull().default(sql`now()`),
  ubicacion: text("ubicacion"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

// RN-12: Notificaciones
export const notificaciones = pgTable("notificaciones", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  usuarioId: varchar("usuario_id").notNull().references(() => users.id),
  tipo: tipoNotificacionEnum("tipo").notNull(),
  titulo: varchar("titulo").notNull(),
  contenido: text("contenido"),
  leida: boolean("leida").notNull().default(false),
  datosJson: text("datos_json"), // JSON serializado
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

// RN-15: Auditoría y Trazabilidad
export const auditLogs = pgTable("audit_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  usuarioId: varchar("usuario_id").references(() => users.id),
  accion: tipoAccionAuditEnum("accion").notNull(),
  entidad: varchar("entidad"), // 'reserva', 'ruta', 'usuario', etc
  entidadId: varchar("entidad_id"),
  detalles: text("detalles"), // JSON serializado con cambios
  ipAddress: varchar("ip_address"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export type Checkin = typeof checkins.$inferSelect;
export type Notificacion = typeof notificaciones.$inferSelect;
export type AuditLog = typeof auditLogs.$inferSelect;
export type Calificacion = typeof calificaciones.$inferSelect;
export type InsertCalificacion = z.infer<typeof insertCalificacionSchema>;
