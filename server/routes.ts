import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { upload } from "./upload";
import {
  hashPassword,
  comparePassword,
  generateToken,
  authenticate,
  authorizeRole,
} from "./auth";
import {
  insertUserSchema,
  loginSchema,
  insertRutaSchema,
  insertReservaSchema,
} from "@shared/schema";

// RN-11: Middleware para verificar que el usuario no esté suspendido
async function checkNotSuspended(userId: string): Promise<boolean> {
  const user = await storage.getUser(userId);
  return !user?.suspendido;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth Routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const validatedData = insertUserSchema.parse(req.body);
      
      const existingUser = await storage.getUserByEmail(validatedData.email);
      if (existingUser) {
        return res.status(400).json({ error: "El email ya está registrado" });
      }

      const hashedPassword = await hashPassword(validatedData.password);
      const user = await storage.createUser({
        ...validatedData,
        password: hashedPassword,
      });

      const token = generateToken({
        userId: user.id,
        email: user.email,
        rol: user.rol,
      });

      const { password: _, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword, token });
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Error al registrar usuario" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const validatedData = loginSchema.parse(req.body);
      
      const user = await storage.getUserByEmail(validatedData.email);
      if (!user) {
        return res.status(401).json({ error: "Credenciales inválidas" });
      }

      const isValidPassword = await comparePassword(
        validatedData.password,
        user.password
      );
      if (!isValidPassword) {
        return res.status(401).json({ error: "Credenciales inválidas" });
      }

      const token = generateToken({
        userId: user.id,
        email: user.email,
        rol: user.rol,
      });

      const { password: _, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword, token });
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Error al iniciar sesión" });
    }
  });

  app.get("/api/auth/me", authenticate, async (req, res) => {
    try {
      const user = await storage.getUser(req.user!.userId);
      if (!user) {
        return res.status(404).json({ error: "Usuario no encontrado" });
      }

      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Error al obtener usuario" });
    }
  });

  // Rutas Routes
  app.get("/api/rutas", async (req, res) => {
    try {
      const { destino, dificultad, precioMax, q, tag } = req.query;
      const rutas = await storage.getAllRutas({
        destino: destino as string,
        dificultad: dificultad as string,
        precioMax: precioMax ? parseInt(precioMax as string) : undefined,
        q: q as string,
        tag: tag as string,
      }, req.user); // Pasar el usuario para filtrar por estado
      res.json(rutas);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Error al obtener rutas" });
    }
  });

  app.get("/api/rutas/:id", async (req, res) => {
    try {
      const ruta = await storage.getRuta(req.params.id);
      if (!ruta) {
        return res.status(404).json({ error: "Ruta no encontrada" });
      }
      res.json(ruta);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Error al obtener ruta" });
    }
  });

  app.post(
    "/api/rutas",
    authenticate,
    authorizeRole(["admin", "anfitrion"]),
    async (req, res) => {
      try {
        const validatedData = insertRutaSchema.parse(req.body);

        const ruta = await storage.createRuta({
          ...validatedData,
          anfitrionId: req.user!.userId, // El anfitrión es quien sube
        });

        res.status(201).json(ruta);
      } catch (error: any) {
        res.status(400).json({ error: error.message || "Error al crear ruta" });
      }
    }
  );

  app.patch(
    "/api/rutas/:id",
    authenticate,
    authorizeRole(["admin", "anfitrion"]),
    async (req, res) => {
      try {
        // Obtener ruta actual
        const rutaActual = await storage.getRuta(req.params.id);
        if (!rutaActual) {
          return res.status(404).json({ error: "Ruta no encontrada" });
        }

        // Verificar permisos - anfitrión solo puede actualizar sus propias rutas
        if (req.user!.rol === "anfitrion" && rutaActual.anfitrionId !== req.user!.userId) {
          return res.status(403).json({ error: "No tienes permisos para actualizar esta ruta" });
        }

        // Validar datos
        const validatedData = insertRutaSchema.partial().parse(req.body);

        const ruta = await storage.updateRuta(req.params.id, validatedData);
        if (!ruta) {
          return res.status(404).json({ error: "Ruta no encontrada" });
        }
        res.json(ruta);
      } catch (error: any) {
        res.status(400).json({ error: error.message || "Error al actualizar ruta" });
      }
    }
  );

  app.delete(
    "/api/rutas/:id",
    authenticate,
    authorizeRole(["admin", "anfitrion"]),
    async (req, res) => {
      try {
        // Obtener ruta para verificar permisos y obtener imagen
        const ruta = await storage.getRuta(req.params.id);
        if (!ruta) {
          return res.status(404).json({ error: "Ruta no encontrada" });
        }

        // Verificar permisos
        if (req.user!.rol === "anfitrion" && ruta.anfitrionId !== req.user!.userId) {
          return res.status(403).json({ error: "No tienes permisos para eliminar esta ruta" });
        }

        // RN-13: Validar que no haya reservas activas
        const reservasActivas = await storage.getReservasPorRuta(req.params.id, req.user!).catch(() => []);
        const reservasActuales = reservasActivas.filter(r => !["cancelada", "cerrada"].includes(r.estado));
        if (reservasActuales.length > 0) {
          return res.status(400).json({ 
            error: `No se puede eliminar una ruta con ${reservasActuales.length} reserva(s) activa(s)` 
          });
        }

        // Eliminar imagen si es local
        if (ruta.imagenUrl && ruta.imagenUrl.startsWith("/uploads/")) {
          const fs = await import("fs").then(m => m.promises);
          const imagePath = `client/public${ruta.imagenUrl}`;
          try {
            await fs.unlink(imagePath);
          } catch {}
        }

        const deleted = await storage.deleteRuta(req.params.id);
        if (!deleted) {
          return res.status(404).json({ error: "Ruta no encontrada" });
        }
        res.status(204).send();
      } catch (error: any) {
        res.status(500).json({ error: error.message || "Error al eliminar ruta" });
      }
    }
  );

  // Reservas Routes
  app.get("/api/reservas/mias", authenticate, async (req, res) => {
    try {
      const reservas = await storage.getReservasByUser(req.user!.userId);
      res.json(reservas);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Error al obtener reservas" });
    }
  });

  app.get(
    "/api/reservas",
    authenticate,
    authorizeRole(["admin"]),
    async (req, res) => {
      try {
        const reservas = await storage.getAllReservas();
        res.json(reservas);
      } catch (error: any) {
        res.status(500).json({ error: error.message || "Error al obtener reservas" });
      }
    }
  );

  app.get(
    "/api/reservas/por-ruta/:rutaId",
    authenticate,
    authorizeRole(["anfitrion", "admin"]),
    async (req, res) => {
      try {
        const reservas = await storage.getReservasPorRuta(req.params.rutaId, req.user!);
        res.json(reservas);
      } catch (error: any) {
        res.status(error.message.includes("permisos") ? 403 : 500).json({ 
          error: error.message || "Error al obtener reservas de la ruta" 
        });
      }
    }
  );

  app.post("/api/reservas", authenticate, async (req, res) => {
    try {
      // RN-11: Verificar que el usuario no esté suspendido
      const usuarioActual = await storage.getUser(req.user!.userId);
      if (usuarioActual?.suspendido) {
        return res.status(403).json({ error: "Tu cuenta ha sido suspendida y no puedes realizar esta acción" });
      }

      console.log("📝 Creando reserva:");
      console.log("   Usuario:", req.user);
      console.log("   Rol del usuario:", req.user?.rol);
      console.log("   Datos recibidos:", req.body);
      
      const validatedData = insertReservaSchema.parse(req.body);
      console.log("✅ Validación exitosa:", validatedData);
      
      const ruta = await storage.getRuta(validatedData.rutaId);
      if (!ruta) {
        console.log("❌ Ruta no encontrada:", validatedData.rutaId);
        return res.status(404).json({ error: "Ruta no encontrada" });
      }

      if (!req.user?.userId) {
        console.log("❌ Usuario no autenticado");
        return res.status(401).json({ error: "Usuario no autenticado" });
      }

      console.log("✅ Creando reserva para usuario:", req.user.userId, "en ruta:", validatedData.rutaId);
      const reserva = await storage.createReserva({
        ...validatedData,
        userId: req.user.userId,
      });

      // RN-12: Crear notificación de reserva creada
      const anfitrion = await storage.getUser(ruta.anfitrionId || "");
      if (anfitrion) {
        await storage.crearNotificacion(
          anfitrion.id,
          "reserva_creada",
          "Nueva reserva en tu ruta",
          `Se ha creado una nueva reserva para ${ruta.nombre}`,
          { rutaId: ruta.id, reservaId: reserva.id }
        );
      }

      // RN-15: Registrar en auditoría
      await storage.registrarAuditLog(
        req.user.userId,
        "crear",
        "reserva",
        reserva.id,
        { rutaId: validatedData.rutaId, cantidadPersonas: validatedData.cantidadPersonas }
      );

      console.log("✅ Reserva creada exitosamente:", reserva.id);
      res.status(201).json(reserva);
    } catch (error: any) {
      console.error("❌ Error al crear reserva:", error.message);
      console.error("   Stack:", error.stack);
      console.error("   Code:", error.code);
      
      // Errores específicos
      if (error.message.includes("cupo")) {
        return res.status(400).json({ error: error.message });
      }
      
      res.status(400).json({ error: error.message || "Error al crear reserva" });
    }
  });

  app.put(
    "/api/reservas/:id/estado",
    authenticate,
    authorizeRole(["anfitrion", "admin"]),
    async (req, res) => {
      try {
        const { estado } = req.body;
        if (!["pendiente", "confirmada", "cancelada"].includes(estado)) {
          return res.status(400).json({ error: "Estado inválido" });
        }

        const reserva = await storage.cambiarEstadoReserva(req.params.id, estado, req.user!);
        if (!reserva) {
          return res.status(404).json({ error: "Reserva no encontrada" });
        }

        res.json(reserva);
      } catch (error: any) {
        const statusCode = error.message.includes("permisos") ? 403 
          : error.message.includes("no encontrada") ? 404 
          : 400;
        res.status(statusCode).json({ 
          error: error.message || "Error al actualizar reserva" 
        });
      }
    }
  );

  // PATCH para actualizar estado de reserva (desde anfitrion panel)
  app.patch(
    "/api/reservas/:id",
    authenticate,
    authorizeRole(["anfitrion", "admin"]),
    async (req, res) => {
      try {
        const { estado } = req.body;
        if (!["pendiente", "confirmada", "cancelada"].includes(estado)) {
          return res.status(400).json({ error: "Estado inválido" });
        }

        const reserva = await storage.cambiarEstadoReserva(req.params.id, estado, req.user!);
        if (!reserva) {
          return res.status(404).json({ error: "Reserva no encontrada" });
        }

        res.json(reserva);
      } catch (error: any) {
        const statusCode = error.message.includes("permisos") ? 403 
          : error.message.includes("no encontrada") ? 404 
          : 400;
        res.status(statusCode).json({ 
          error: error.message || "Error al actualizar reserva" 
        });
      }
    }
  );

  // DELETE para cancelar reserva (turistas pueden cancelar sus propias)
  app.delete(
    "/api/reservas/:id",
    authenticate,
    async (req, res) => {
      try {
        const reserva = await storage.cancelarReserva(req.params.id, req.user!);
        if (!reserva) {
          return res.status(404).json({ error: "Reserva no encontrada" });
        }

        res.json({ message: "Reserva cancelada", reserva });
      } catch (error: any) {
        const statusCode = error.message.includes("permisos") ? 403 
          : error.message.includes("no encontrada") ? 404 
          : 400;
        res.status(statusCode).json({ 
          error: error.message || "Error al cancelar reserva" 
        });
      }
    }
  );

  // ==================== NUEVOS ENDPOINTS ====================

  // RN-09: Check-in / Asistencia
  app.post(
    "/api/reservas/:id/checkin",
    authenticate,
    authorizeRole(["anfitrion", "guia", "admin"]),
    async (req, res) => {
      try {
        const { ubicacion } = req.body;
        
        const reserva = await storage.getReservaById(req.params.id);
        
        if (!reserva) {
          return res.status(404).json({ error: "Reserva no encontrada" });
        }

        if (reserva.estado !== "confirmada") {
          return res.status(400).json({ error: "El check-in solo se puede realizar en reservas confirmadas" });
        }

        const checkin = await storage.crearCheckin(req.params.id, req.user!.userId, ubicacion);
        await storage.registrarAuditLog(
          req.user!.userId,
          "checkin",
          "reserva",
          req.params.id,
          { ubicacion }
        );

        res.status(201).json(checkin);
      } catch (error: any) {
        res.status(400).json({ error: error.message || "Error al registrar check-in" });
      }
    }
  );

  // RN-09: Obtener check-ins de una reserva
  app.get(
    "/api/reservas/:id/checkins",
    authenticate,
    async (req, res) => {
      try {
        const checkins = await storage.obtenerCheckinsDeReserva(req.params.id);
        res.json(checkins);
      } catch (error: any) {
        res.status(500).json({ error: error.message || "Error al obtener check-ins" });
      }
    }
  );

  // RN-12: Notificaciones - Obtener
  app.get(
    "/api/notificaciones",
    authenticate,
    async (req, res) => {
      try {
        const notificaciones = await storage.obtenerNotificaciones(req.user!.userId);
        res.json(notificaciones);
      } catch (error: any) {
        res.status(500).json({ error: error.message || "Error al obtener notificaciones" });
      }
    }
  );

  // RN-12: Notificaciones - Marcar como leída
  app.patch(
    "/api/notificaciones/:id/leer",
    authenticate,
    async (req, res) => {
      try {
        const notificacion = await storage.marcarNotificacionLeida(req.params.id);
        if (!notificacion) {
          return res.status(404).json({ error: "Notificación no encontrada" });
        }
        res.json(notificacion);
      } catch (error: any) {
        res.status(400).json({ error: error.message || "Error al marcar notificación como leída" });
      }
    }
  );

  // RN-06: Calificaciones - Crear
  app.post(
    "/api/reservas/:id/calificar",
    authenticate,
    async (req, res) => {
      try {
        const { puntuacion, comentario } = req.body;

        if (!puntuacion || puntuacion < 1 || puntuacion > 5) {
          return res.status(400).json({ error: "La puntuación debe estar entre 1 y 5" });
        }

        const reserva = await storage.getReservaById(req.params.id);
        
        if (!reserva) {
          return res.status(404).json({ error: "Reserva no encontrada" });
        }

        if (reserva.userId !== req.user!.userId) {
          return res.status(403).json({ error: "Solo el turista de la reserva puede calificar" });
        }

        const calificacion = await storage.crearCalificacion(
          req.params.id,
          req.user!.userId,
          puntuacion,
          comentario
        );

        await storage.registrarAuditLog(
          req.user!.userId,
          "calificar",
          "reserva",
          req.params.id,
          { puntuacion, comentario }
        );

        res.status(201).json(calificacion);
      } catch (error: any) {
        res.status(400).json({ error: error.message || "Error al calificar" });
      }
    }
  );

  // RN-11: Admin - Suspender usuario
  app.put(
    "/api/admin/usuarios/:id/suspender",
    authenticate,
    authorizeRole(["admin"]),
    async (req, res) => {
      try {
        const { motivo } = req.body;
        if (!motivo) {
          return res.status(400).json({ error: "El motivo de suspensión es requerido" });
        }

        const usuarioSuspendido = await storage.suspenderUsuario(req.params.id, motivo);
        if (!usuarioSuspendido) {
          return res.status(404).json({ error: "Usuario no encontrado" });
        }

        await storage.registrarAuditLog(
          req.user!.userId,
          "suspender",
          "usuario",
          req.params.id,
          { motivo }
        );

        await storage.crearNotificacion(
          req.params.id,
          "suspension",
          "Tu cuenta ha sido suspendida",
          `Motivo: ${motivo}`,
          { motivo }
        );

        res.json({ message: "Usuario suspendido exitosamente", usuario: usuarioSuspendido });
      } catch (error: any) {
        res.status(400).json({ error: error.message || "Error al suspender usuario" });
      }
    }
  );

  // RN-11: Admin - Restaurar usuario
  app.put(
    "/api/admin/usuarios/:id/restaurar",
    authenticate,
    authorizeRole(["admin"]),
    async (req, res) => {
      try {
        const usuarioRestaurado = await storage.restaurarUsuario(req.params.id);
        if (!usuarioRestaurado) {
          return res.status(404).json({ error: "Usuario no encontrado" });
        }

        await storage.registrarAuditLog(
          req.user!.userId,
          "actualizar",
          "usuario",
          req.params.id,
          { accion: "restaurar" }
        );

        await storage.crearNotificacion(
          req.params.id,
          "rol_validado",
          "Tu cuenta ha sido restaurada",
          "Ahora puedes volver a usar la plataforma"
        );

        res.json({ message: "Usuario restaurado exitosamente", usuario: usuarioRestaurado });
      } catch (error: any) {
        res.status(400).json({ error: error.message || "Error al restaurar usuario" });
      }
    }
  );

  // RN-11: Admin - Ocultar ruta
  app.put(
    "/api/admin/rutas/:id/ocultar",
    authenticate,
    authorizeRole(["admin"]),
    async (req, res) => {
      try {
        const ruta = await storage.ocultarRuta(req.params.id);
        if (!ruta) {
          return res.status(404).json({ error: "Ruta no encontrada" });
        }

        await storage.registrarAuditLog(
          req.user!.userId,
          "actualizar",
          "ruta",
          req.params.id,
          { estado: "OCULTA" }
        );

        res.json({ message: "Ruta ocultada exitosamente", ruta });
      } catch (error: any) {
        res.status(400).json({ error: error.message || "Error al ocultar ruta" });
      }
    }
  );

  // RN-14: Admin - Validar rol de usuario
  app.put(
    "/api/admin/usuarios/:id/validar-rol",
    authenticate,
    authorizeRole(["admin"]),
    async (req, res) => {
      try {
        const usuario = await storage.getUser(req.params.id);
        if (!usuario) {
          return res.status(404).json({ error: "Usuario no encontrado" });
        }

        if (usuario.rol === "turista") {
          return res.status(400).json({ error: "Los turistas no necesitan validación de rol" });
        }

        const usuarioValidado = await storage.validarRolUsuario(req.params.id);

        await storage.registrarAuditLog(
          req.user!.userId,
          "validar_rol",
          "usuario",
          req.params.id,
          { rol: usuario.rol }
        );

        await storage.crearNotificacion(
          req.params.id,
          "rol_validado",
          "Tu rol ha sido validado",
          `Tu rol de ${usuario.rol} ha sido aprobado por un administrador`
        );

        res.json({ message: "Rol validado exitosamente", usuario: usuarioValidado });
      } catch (error: any) {
        res.status(400).json({ error: error.message || "Error al validar rol" });
      }
    }
  );

  // RN-15: Admin - Obtener logs de auditoría
  app.get(
    "/api/admin/audit-logs",
    authenticate,
    authorizeRole(["admin"]),
    async (req, res) => {
      try {
        const { usuarioId, accion, entidad, desde, hasta } = req.query;

        const logs = await storage.obtenerAuditLogs({
          usuarioId: usuarioId as string | undefined,
          accion: accion as string | undefined,
          entidad: entidad as string | undefined,
          desde: desde ? new Date(desde as string) : undefined,
          hasta: hasta ? new Date(hasta as string) : undefined,
        });

        res.json(logs);
      } catch (error: any) {
        res.status(500).json({ error: error.message || "Error al obtener logs de auditoría" });
      }
    }
  );

  const httpServer = createServer(app);

  return httpServer;
}
