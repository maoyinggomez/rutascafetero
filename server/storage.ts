import { eq, sql, and, or, ilike, lte, arrayContains, desc } from "drizzle-orm";
import { db } from "./db";
import {
  type User,
  type InsertUser,
  type Ruta,
  type InsertRuta,
  type Reserva,
  type InsertReserva,
  type InsertReservaDB,
  type Calificacion,
  type InsertCalificacion,
  type Notificacion,
  type AuditLog,
  type Checkin,
  users,
  rutas,
  reservas,
  calificaciones,
  auditLogs,
  notificaciones,
  checkins,
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
    precioMax?: number;
    q?: string;
    tag?: string;
  }): Promise<Ruta[]>;
  getRuta(id: string): Promise<Ruta | undefined>;
  createRuta(ruta: InsertRuta): Promise<Ruta>;
  updateRuta(id: string, ruta: Partial<InsertRuta>): Promise<Ruta | undefined>;
  deleteRuta(id: string): Promise<boolean>;

  // RN-13: Validar integridad de datos
  puedeEliminarse(rutaId: string): Promise<boolean>;
  ocultarRutasDeAnfitrion(anfitrionId: string): Promise<void>;

  // Reservas
  getReserva(id: string): Promise<Reserva | undefined>;
  getReservasByUser(userId: string): Promise<Reserva[]>;
  getReservaById(id: string): Promise<Reserva | undefined>;
  getAllReservas(): Promise<Reserva[]>;
  getReservasPorRuta(rutaId: string, user: JWTPayload): Promise<Reserva[]>;
  createReserva(reserva: InsertReservaDB): Promise<Reserva>;
  updateReservaEstado(
    id: string,
    estado: "pendiente" | "confirmada" | "cancelada"
  ): Promise<Reserva | undefined>;
  changiarEstadoReserva(
    id: string,
    estado: "pendiente" | "confirmada" | "cancelada",
    user: JWTPayload
  ): Promise<Reserva | undefined>;
  cancelarReserva(id: string, user: JWTPayload): Promise<Reserva | undefined>;

  // Calificaciones
  createCalificacion(calificacion: InsertCalificacion & { userId: string }): Promise<Calificacion>;
  getCalificacionPorReserva(reservaId: string): Promise<Calificacion | undefined>;
  getCalificacionesPorRuta(rutaId: string): Promise<Calificacion[]>;
  updateRutaRating(rutaId: string): Promise<void>;
  
  // RN-11: Moderación
  suspenderUsuario(userId: string, motivo: string): Promise<User | undefined>;
  restaurarUsuario(userId: string): Promise<User | undefined>;
  ocultarRuta(rutaId: string): Promise<Ruta | undefined>;
  
  // RN-12: Notificaciones
  crearNotificacion(usuarioId: string, tipo: string, titulo: string, contenido?: string, datosJson?: any): Promise<Notificacion>;
  obtenerNotificaciones(usuarioId: string): Promise<Notificacion[]>;
  marcarNotificacionLeida(notificacionId: string): Promise<Notificacion | undefined>;
  
  // RN-09: Check-in
  crearCheckin(reservaId: string, usuarioId: string, ubicacion?: string): Promise<Checkin>;
  obtenerCheckinsDeReserva(reservaId: string): Promise<Checkin[]>;
  
  // RN-15: Auditoría
  registrarAuditLog(usuarioId: string | undefined, accion: string, entidad: string | undefined, entidadId: string | undefined, detalles?: any, ipAddress?: string): Promise<AuditLog>;
  obtenerAuditLogs(filtros?: { usuarioId?: string; accion?: string; entidad?: string; desde?: Date; hasta?: Date }): Promise<AuditLog[]>;
  
  // RN-14: Validación de roles
  validarRolUsuario(userId: string): Promise<User | undefined>;
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
    precioMax?: number;
    q?: string;
    tag?: string;
  }, user?: JWTPayload): Promise<Ruta[]> {
    const conditions = [];

    // RN-16: Filtrar por estado según rol
    if (!user || user.rol === "turista") {
      // Los turistas solo ven rutas PUBLICADAS
      conditions.push(eq(rutas.estado, "PUBLICADA"));
    } else if (user.rol === "anfitrion" || user.rol === "guia") {
      // Los anfitriones y guías ven sus rutas en cualquier estado y otras PUBLICADAS
      conditions.push(
        or(
          eq(rutas.estado, "PUBLICADA"),
          eq(rutas.anfitrionId, user.userId)
        )!
      );
    }
    // Los admins ven todas las rutas

    if (filters?.destino && filters.destino !== "todos") {
      conditions.push(eq(rutas.destino, filters.destino));
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
  async getReserva(id: string): Promise<Reserva | undefined> {
    const result = await db.select().from(reservas).where(eq(reservas.id, id));
    return result[0];
  }

  async getReservasByUser(userId: string): Promise<Reserva[]> {
    return db.select().from(reservas).where(eq(reservas.userId, userId));
  }

  async getReservaById(id: string): Promise<Reserva | undefined> {
    const result = await db.select().from(reservas).where(eq(reservas.id, id));
    return result[0];
  }

  async getAllReservas(): Promise<Reserva[]> {
    return db.select().from(reservas);
  }

  async createReserva(reserva: InsertReservaDB): Promise<Reserva> {
    // Validar que la ruta existe
    const rutaResult = await db.select().from(rutas).where(eq(rutas.id, reserva.rutaId));
    if (!rutaResult.length) {
      throw new Error("Ruta no encontrada");
    }
    
    const ruta = rutaResult[0];

    // RN-08: Validar que la fecha no sea pasada
    const now = new Date();
    if (reserva.fechaRuta <= now) {
      throw new Error("No se permiten reservas con fechas pasadas");
    }
    
    // Contar reservas existentes para esta ruta
    const existingReservas = await db
      .select()
      .from(reservas)
      .where(
        and(
          eq(reservas.rutaId, reserva.rutaId),
          eq(reservas.estado, "confirmada")
        )
      );
    
    // Calcular espacios ocupados
    const espaciosOcupados = existingReservas.reduce(
      (total, res) => total + res.cantidadPersonas,
      0
    );
    
    // Validar que hay cupo disponible
    const espaciosDisponibles = ruta.cupoMaximo - espaciosOcupados;
    if (reserva.cantidadPersonas > espaciosDisponibles) {
      throw new Error(
        `No hay cupo disponible. Espacios disponibles: ${espaciosDisponibles}, solicitados: ${reserva.cantidadPersonas}`
      );
    }
    
    // RN-05: Congelar el precio al momento de la reserva
    const result = await db.insert(reservas).values({
      ...reserva,
      precioPorPersonaAlMomento: ruta.precioPorPersona,
    }).returning();
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

  async changiarEstadoReserva(
    id: string,
    estado: "pendiente" | "confirmada" | "cancelada",
    user: JWTPayload
  ): Promise<Reserva | undefined> {
    // Verificar que el usuario no esté suspendido (RN-11)
    const usuarioActual = await this.getUser(user.userId);
    if (usuarioActual?.suspendido) {
      throw new Error("Tu cuenta ha sido suspendida y no puedes realizar acciones");
    }

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

      // Validar transición de estado válida
      const estadoActual = reserva[0].estado;
      const transicionesValidas: Record<string, string[]> = {
        pendiente: ["confirmada", "cancelada"],
        confirmada: ["cancelada"],
        cancelada: [],
      };

      if (!transicionesValidas[estadoActual]?.includes(estado)) {
        throw new Error(
          `Transición de estado no válida: de ${estadoActual} a ${estado}`
        );
      }
    }

    const result = await db
      .update(reservas)
      .set({ estado: estado as any })
      .where(eq(reservas.id, id))
      .returning();
    
    // RN-12: Crear notificación basada en el nuevo estado
    if (result.length > 0) {
      const reservaActualizada = result[0];
      const turista = await this.getUser(reservaActualizada.userId);
      
      if (estado === "confirmada" && turista) {
        await this.crearNotificacion(
          turista.id,
          "reserva_confirmada",
          "¡Tu reserva ha sido confirmada!",
          "Tu reserva ha sido aceptada",
          { reservaId: id }
        );
      } else if (estado === "cancelada" && turista) {
        await this.crearNotificacion(
          turista.id,
          "reserva_cancelada",
          "Tu reserva ha sido cancelada",
          "La reserva ha sido cancelada",
          { reservaId: id }
        );
      }
    }

    return result[0];
  }

  async cancelarReserva(
    id: string,
    user: JWTPayload,
    motivo?: string
  ): Promise<Reserva | undefined> {
    // Validar que el usuario no esté suspendido (RN-11)
    const usuarioActual = await this.getUser(user.userId);
    if (usuarioActual?.suspendido) {
      throw new Error("Tu cuenta ha sido suspendida y no puedes realizar acciones");
    }

    // Obtener la reserva
    const reservaResult = await db.select().from(reservas).where(eq(reservas.id, id));
    if (!reservaResult.length) {
      throw new Error("Reserva no encontrada");
    }
    
    const reserva = reservaResult[0];

    // Turistas solo pueden cancelar sus propias reservas
    if (user.rol === "turista") {
      if (reserva.userId !== user.userId) {
        throw new Error("No tienes permisos para cancelar esta reserva");
      }

      // RN-07: Solo puede cancelar si está en estado pendiente o confirmada
      if (!["pendiente", "confirmada"].includes(reserva.estado)) {
        throw new Error(
          `No puedes cancelar una reserva en estado ${reserva.estado}`
        );
      }

      // RN-07/RN-08: Validar que la fecha aún no haya pasado
      const now = new Date();
      if (reserva.fechaRuta <= now) {
        throw new Error("No puedes cancelar una reserva cuya fecha ya pasó");
      }

      // RN-07: Turista no requiere motivo
    } else if (user.rol === "anfitrion" || user.rol === "guia") {
      // Verificar que sea su ruta
      if (user.rol === "anfitrion") {
        const ruta = await db.select().from(rutas).where(eq(rutas.id, reserva.rutaId));
        if (!ruta.length || ruta[0].anfitrionId !== user.userId) {
          throw new Error("No tienes permisos para cancelar esta reserva");
        }
      }
      // RN-07: Anfitrión/guía solo pueden cancelar si no está cerrada o en progreso
      if (reserva.estado === "cerrada") {
        throw new Error("No puedes cancelar una reserva cerrada");
      }
      
      // RN-07: Anfitrión/guía debe proporcionar causa justificada
      if (!motivo || motivo.trim().length === 0) {
        throw new Error("Debes proporcionar una causa justificada para cancelar esta reserva");
      }
    }

    // RN-07: Al cancelar, liberar cupos
    const result = await db
      .update(reservas)
      .set({ estado: "cancelada" })
      .where(eq(reservas.id, id))
      .returning();
    
    return result[0];
  }

  // RN-11: Moderación - Suspender usuario
  async suspenderUsuario(userId: string, motivo: string): Promise<User | undefined> {
    const result = await db
      .update(users)
      .set({
        suspendido: true,
        motivoSuspension: motivo,
        fechaSuspension: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    return result[0];
  }

  // RN-11: Moderación - Restaurar usuario
  async restaurarUsuario(userId: string): Promise<User | undefined> {
    const result = await db
      .update(users)
      .set({
        suspendido: false,
        motivoSuspension: null,
        fechaSuspension: null,
      })
      .where(eq(users.id, userId))
      .returning();
    return result[0];
  }

  // RN-11: Moderación - Ocultar ruta
  async ocultarRuta(rutaId: string): Promise<Ruta | undefined> {
    const result = await db
      .update(rutas)
      .set({ estado: "OCULTA" })
      .where(eq(rutas.id, rutaId))
      .returning();
    return result[0];
  }

  // RN-13: Validar que ruta puede eliminarse (sin reservas activas)
  async puedeEliminarse(rutaId: string): Promise<boolean> {
    const reservasActivas = await db.select().from(reservas).where(
      and(
        eq(reservas.rutaId, rutaId),
        or(
          eq(reservas.estado, "pendiente"),
          eq(reservas.estado, "confirmada")
        )
      )
    );
    return reservasActivas.length === 0;
  }

  // RN-13: Si anfitrión elimina cuenta, ocultar sus rutas automáticamente
  async ocultarRutasDeAnfitrion(anfitrionId: string): Promise<void> {
    await db
      .update(rutas)
      .set({ estado: "OCULTA" })
      .where(eq(rutas.anfitrionId, anfitrionId));
  }

  // RN-12: Notificaciones - Crear
  async crearNotificacion(
    usuarioId: string,
    tipo: string,
    titulo: string,
    contenido?: string,
    datosJson?: any
  ): Promise<Notificacion> {
    const result = await db
      .insert(notificaciones)
      .values({
        usuarioId,
        tipo: tipo as any,
        titulo,
        contenido,
        datosJson: datosJson ? JSON.stringify(datosJson) : null,
      })
      .returning();
    return result[0];
  }

  // RN-12: Notificaciones - Obtener
  async obtenerNotificaciones(usuarioId: string): Promise<Notificacion[]> {
    return db
      .select()
      .from(notificaciones)
      .where(eq(notificaciones.usuarioId, usuarioId))
      .orderBy(desc(notificaciones.createdAt));
  }

  // RN-12: Notificaciones - Marcar como leída
  async marcarNotificacionLeida(notificacionId: string): Promise<Notificacion | undefined> {
    const result = await db
      .update(notificaciones)
      .set({ leida: true })
      .where(eq(notificaciones.id, notificacionId))
      .returning();
    return result[0];
  }

  // RN-09: Check-in - Crear
  async crearCheckin(
    reservaId: string,
    usuarioId: string,
    ubicacion?: string
  ): Promise<Checkin> {
    const result = await db
      .insert(checkins)
      .values({
        reservaId,
        usuarioId,
        ubicacion,
      })
      .returning();
    return result[0];
  }

  // RN-09: Check-in - Obtener
  async obtenerCheckinsDeReserva(reservaId: string): Promise<Checkin[]> {
    return db
      .select()
      .from(checkins)
      .where(eq(checkins.reservaId, reservaId))
      .orderBy(checkins.fechaHora);
  }

  // RN-15: Auditoría - Registrar
  async registrarAuditLog(
    usuarioId: string | undefined,
    accion: string,
    entidad: string | undefined,
    entidadId: string | undefined,
    detalles?: any,
    ipAddress?: string
  ): Promise<AuditLog> {
    const result = await db
      .insert(auditLogs)
      .values({
        usuarioId,
        accion: accion as any,
        entidad,
        entidadId,
        detalles: detalles ? JSON.stringify(detalles) : null,
        ipAddress,
      })
      .returning();
    return result[0];
  }

  // RN-15: Auditoría - Obtener logs
  async obtenerAuditLogs(filtros?: {
    usuarioId?: string;
    accion?: string;
    entidad?: string;
    desde?: Date;
    hasta?: Date;
  }): Promise<AuditLog[]> {
    const conditions: any[] = [];

    if (filtros?.usuarioId) {
      conditions.push(eq(auditLogs.usuarioId, filtros.usuarioId));
    }
    if (filtros?.accion) {
      conditions.push(eq(auditLogs.accion, filtros.accion as any));
    }
    if (filtros?.entidad) {
      conditions.push(eq(auditLogs.entidad, filtros.entidad));
    }
    if (filtros?.desde) {
      conditions.push(sql`${auditLogs.createdAt} >= ${filtros.desde}`);
    }
    if (filtros?.hasta) {
      conditions.push(sql`${auditLogs.createdAt} <= ${filtros.hasta}`);
    }

    let query = db.select().from(auditLogs);
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    return query.orderBy(desc(auditLogs.createdAt));
  }

  // RN-06: Calificaciones - Crear
  async crearCalificacion(
    reservaId: string,
    usuarioId: string,
    puntuacion: number,
    comentario?: string
  ): Promise<Calificacion> {
    if (puntuacion < 1 || puntuacion > 5) {
      throw new Error("La puntuación debe estar entre 1 y 5");
    }

    const result = await db
      .insert(calificaciones)
      .values({
        reservaId,
        usuarioId,
        puntuacion,
        comentario,
      })
      .returning();
    return result[0];
  }

  // RN-06: Calificaciones - Obtener de ruta
  async obtenerCalificacionesDeRuta(rutaId: string): Promise<Calificacion[]> {
    return db
      .select()
      .from(calificaciones)
      .innerJoin(reservas, eq(calificaciones.reservaId, reservas.id))
      .where(eq(reservas.rutaId, rutaId));
  }

  // RN-14: Validación de roles
  async validarRolUsuario(userId: string): Promise<User | undefined> {
    const result = await db
      .update(users)
      .set({ rolValidado: true })
      .where(eq(users.id, userId))
      .returning();
    return result[0];
  }

  async createCalificacion(calificacion: InsertCalificacion & { userId: string }): Promise<Calificacion> {
    const result = await db
      .insert(calificaciones)
      .values(calificacion)
      .returning();
    return result[0];
  }

  async getCalificacionPorReserva(reservaId: string): Promise<Calificacion | undefined> {
    const result = await db
      .select()
      .from(calificaciones)
      .where(eq(calificaciones.reservaId, reservaId));
    return result[0];
  }

  async getCalificacionesPorRuta(rutaId: string): Promise<Calificacion[]> {
    return db
      .select()
      .from(calificaciones)
      .where(eq(calificaciones.rutaId, rutaId));
  }

  async updateRutaRating(rutaId: string): Promise<void> {
    // Obtener todas las calificaciones de la ruta
    const rutaCalificaciones = await db
      .select()
      .from(calificaciones)
      .where(eq(calificaciones.rutaId, rutaId));

    if (rutaCalificaciones.length === 0) {
      // Si no hay calificaciones, mantener el rating por defecto
      return;
    }

    // Calcular promedio
    const promedio = rutaCalificaciones.reduce((sum, cal) => sum + cal.rating, 0) / rutaCalificaciones.length;

    // Actualizar ruta con el nuevo rating y cantidad de reseñas
    await db
      .update(rutas)
      .set({
        rating: promedio.toString(),
        resenas: rutaCalificaciones.length,
      })
      .where(eq(rutas.id, rutaId));
  }

  // ADMIN METHODS
  async getAllUsers(): Promise<User[]> {
    return db.select().from(users);
  }
}

export const storage = new PostgresStorage();
