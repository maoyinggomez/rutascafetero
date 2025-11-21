import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, decimal, timestamp, pgEnum, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const roleEnum = pgEnum("role", ["turista", "anfitrion", "guia", "admin"]);
export const dificultadEnum = pgEnum("dificultad", ["Fácil", "Moderado", "Avanzado"]);
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
  dificultad: dificultadEnum("dificultad").notNull(),
  duracion: text("duracion").notNull(),
  precio: integer("precio").notNull(),
  imagenUrl: text("imagen_url").notNull(),
  cupoMaximo: integer("cupo_maximo").notNull().default(20),
  rating: decimal("rating", { precision: 2, scale: 1 }).notNull().default("4.5"),
  resenas: integer("resenas").notNull().default(0),
  anfitrionId: varchar("anfitrion_id").references(() => users.id),
  duracionHoras: integer("duracion_horas").notNull(),
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
  cantidadPersonas: integer("cantidad_personas").notNull(),
  estado: estadoReservaEnum("estado").notNull().default("pendiente"),
  totalPagado: integer("total_pagado").notNull(),
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
  anfitrionId: z.string().optional(),
});

export const insertReservaSchema = createInsertSchema(reservas).omit({
  id: true,
  estado: true,
  createdAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Ruta = typeof rutas.$inferSelect;
export type InsertRuta = z.infer<typeof insertRutaSchema>;
export type Reserva = typeof reservas.$inferSelect;
export type InsertReserva = z.infer<typeof insertReservaSchema>;
