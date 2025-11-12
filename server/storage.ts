import { eq, sql, and, or, ilike, lte, arrayContains } from "drizzle-orm";
import { db } from "./db";
import {
  type User,
  type InsertUser,
  type Ruta,
  type InsertRuta,
  type Reserva,
  type InsertReserva,
  users,
  rutas,
  reservas,
} from "@shared/schema";
import { type JWTPayload } from "./auth";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Rutas
  getAllRutas(filters?: { 
    destino?: string; 
    dificultad?: string;
    precioMax?: number;
    q?: string;
    tag?: string;
  }): Promise<Ruta[]>;
  getRuta(id: string): Promise<Ruta | undefined>;
  createRuta(ruta: InsertRuta): Promise<Ruta>;
  updateRuta(id: string, ruta: Partial<InsertRuta>): Promise<Ruta | undefined>;
  deleteRuta(id: string): Promise<boolean>;

  // Reservas
  getReservasByUser(userId: string): Promise<Reserva[]>;
  getAllReservas(): Promise<Reserva[]>;
  getReservasPorRuta(rutaId: string, user: JWTPayload): Promise<Reserva[]>;
  createReserva(reserva: InsertReserva): Promise<Reserva>;
  updateReservaEstado(
    id: string,
    estado: "pendiente" | "confirmada" | "cancelada"
  ): Promise<Reserva | undefined>;
  cambiarEstadoReserva(
    id: string,
    estado: "pendiente" | "confirmada" | "cancelada",
    user: JWTPayload
  ): Promise<Reserva | undefined>;
}

export class PostgresStorage implements IStorage {
  // Users
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email));
    return result[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    const result = await db.insert(users).values(user).returning();
    return result[0];
  }

  // Rutas
  async getAllRutas(filters?: {
    destino?: string;
    dificultad?: string;
    precioMax?: number;
    q?: string;
    tag?: string;
  }): Promise<Ruta[]> {
    const conditions = [];

    if (filters?.destino && filters.destino !== "todos") {
      conditions.push(eq(rutas.destino, filters.destino));
    }

    if (filters?.dificultad && filters.dificultad !== "todas") {
      conditions.push(eq(rutas.dificultad, filters.dificultad as any));
    }

    if (filters?.precioMax) {
      conditions.push(lte(rutas.precioPorPersona, filters.precioMax));
    }

    if (filters?.q) {
      conditions.push(
        or(
          ilike(rutas.nombre, `%${filters.q}%`),
          ilike(rutas.descripcion, `%${filters.q}%`),
          ilike(rutas.destino, `%${filters.q}%`)
        )!
      );
    }

    if (filters?.tag) {
      conditions.push(sql`${filters.tag} = ANY(${rutas.tags})`);
    }

    let query = db.select().from(rutas);

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    return query;
  }

  async getRuta(id: string): Promise<Ruta | undefined> {
    const result = await db.select().from(rutas).where(eq(rutas.id, id));
    return result[0];
  }

  async createRuta(ruta: InsertRuta): Promise<Ruta> {
    const result = await db.insert(rutas).values(ruta).returning();
    return result[0];
  }

  async updateRuta(
    id: string,
    ruta: Partial<InsertRuta>
  ): Promise<Ruta | undefined> {
    const result = await db
      .update(rutas)
      .set(ruta)
      .where(eq(rutas.id, id))
      .returning();
    return result[0];
  }

  async deleteRuta(id: string): Promise<boolean> {
    const result = await db.delete(rutas).where(eq(rutas.id, id)).returning();
    return result.length > 0;
  }

  // Reservas
  async getReservasByUser(userId: string): Promise<Reserva[]> {
    return db.select().from(reservas).where(eq(reservas.userId, userId));
  }

  async getAllReservas(): Promise<Reserva[]> {
    return db.select().from(reservas);
  }

  async createReserva(reserva: InsertReserva): Promise<Reserva> {
    const result = await db.insert(reservas).values(reserva).returning();
    return result[0];
  }

  async updateReservaEstado(
    id: string,
    estado: "pendiente" | "confirmada" | "cancelada"
  ): Promise<Reserva | undefined> {
    const result = await db
      .update(reservas)
      .set({ estado })
      .where(eq(reservas.id, id))
      .returning();
    return result[0];
  }

  async getReservasPorRuta(rutaId: string, user: JWTPayload): Promise<Reserva[]> {
    if (user.rol !== "anfitrion" && user.rol !== "admin") {
      throw new Error("No tienes permisos para ver las reservas de esta ruta");
    }

    // Verify ownership if anfitrion role
    if (user.rol === "anfitrion") {
      const ruta = await db.select().from(rutas).where(eq(rutas.id, rutaId));
      if (!ruta.length || ruta[0].anfitrionId !== user.userId) {
        throw new Error("No tienes permisos para ver las reservas de esta ruta");
      }
    }

    return db.select().from(reservas).where(eq(reservas.rutaId, rutaId));
  }

  async cambiarEstadoReserva(
    id: string,
    estado: "pendiente" | "confirmada" | "cancelada",
    user: JWTPayload
  ): Promise<Reserva | undefined> {
    if (user.rol !== "anfitrion" && user.rol !== "admin") {
      throw new Error("No tienes permisos para cambiar el estado de una reserva");
    }

    // Verify ownership if anfitrion role
    if (user.rol === "anfitrion") {
      const reserva = await db.select().from(reservas).where(eq(reservas.id, id));
      if (!reserva.length) {
        throw new Error("Reserva no encontrada");
      }
      
      const ruta = await db.select().from(rutas).where(eq(rutas.id, reserva[0].rutaId));
      if (!ruta.length || ruta[0].anfitrionId !== user.userId) {
        throw new Error("No tienes permisos para cambiar el estado de esta reserva");
      }
    }

    const result = await db
      .update(reservas)
      .set({ estado })
      .where(eq(reservas.id, id))
      .returning();
    return result[0];
  }
}

export const storage = new PostgresStorage();
