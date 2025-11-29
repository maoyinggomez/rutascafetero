import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, decimal, timestamp, pgEnum, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const roleEnum = pgEnum("role", ["turista", "anfitrion", "guia", "admin"]);
export const estadoReservaEnum = pgEnum("estado_reserva", ["pendiente", "confirmada", "cancelada"]);

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  nombre: text("nombre").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  rol: roleEnum("rol").notNull().default("turista"),
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
}).extend({
  imagenUrl: z.string().optional(),
  imagenes: z.array(z.string()).optional().default([]),
  anfitrionId: z.string().optional(),
  duracionMinutos: z.number().int().min(5, "La duración mínima es 5 minutos"),
});

export const insertReservaSchema = createInsertSchema(reservas).omit({
  id: true,
  estado: true,
  createdAt: true,
}).extend({
  fechaRuta: z.string().or(z.date()).transform((val) => new Date(val)),
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
export type Calificacion = typeof calificaciones.$inferSelect;
export type InsertCalificacion = z.infer<typeof insertCalificacionSchema>;
