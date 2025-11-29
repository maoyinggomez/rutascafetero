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
  insertCalificacionSchema,
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
      const { adminCode, ...userData } = req.body;
      const validatedData = insertUserSchema.parse(req.body);
      
      // Validar código admin si intenta registrarse como admin
      if (validatedData.rol === "admin") {
        if (!adminCode || adminCode !== "admin123") {
          return res.status(400).json({ error: "Código de administrador inválido" });
        }
      }
      
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
      const { destino, precioMax, q, tag } = req.query;
      const rutas = await storage.getAllRutas({
        destino: destino as string,
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
    upload.fields([{ name: 'imagen', maxCount: 5 }, { name: 'data', maxCount: 1 }]),
    async (req, res) => {
      try {
        // Validar datos básicos
        const data = JSON.parse(req.body.data || "{}");
        const validatedData = insertRutaSchema.parse(data);

        // RN-08: No permitir rutas con fecha pasada
        // Nota: Las rutas no tienen fecha específica, pero se valida en reservas
        // Esta validación se hace cuando se crean reservas para esa ruta

        // Preparar URLs de imágenes - con .fields(), los archivos están en req.files['imagen']
        const imagenesSubidas = (req.files?.imagen || []) as Express.Multer.File[];
        const imagenUrls = imagenesSubidas.map(f => `/uploads/${f.filename}`);
        const allImagens = [...imagenUrls, ...(data.imagenes || [])];
        const imagenUrl = allImagens[0] || validatedData.imagenUrl;

        const ruta = await storage.createRuta({
          ...validatedData,
          imagenUrl,
          imagenes: allImagens,
          anfitrionId: req.user!.userId, // El anfitrión es quien sube
        });

        res.status(201).json(ruta);
      } catch (error: any) {
        // Limpiar archivos si hay error
        const imagenesSubidas = (req.files?.imagen || []) as Express.Multer.File[];
        if (imagenesSubidas.length > 0) {
          const fs = await import("fs").then(m => m.promises);
          for (const file of imagenesSubidas) {
            try {
              await fs.unlink(file.path);
            } catch {}
          }
        }
        res.status(400).json({ error: error.message || "Error al crear ruta" });
      }
    }
  );

  app.patch(
    "/api/rutas/:id",
    authenticate,
    authorizeRole(["admin", "anfitrion"]),
    upload.fields([{ name: 'imagen', maxCount: 5 }, { name: 'data', maxCount: 1 }]),
    async (req, res) => {
      try {
        // Obtener ruta actual
        const rutaActual = await storage.getRuta(req.params.id);
        if (!rutaActual) {
          const imagenesSubidas = (req.files?.imagen || []) as Express.Multer.File[];
          if (imagenesSubidas.length > 0) {
            const fs = await import("fs").then(m => m.promises);
            for (const file of imagenesSubidas) {
              try {
                await fs.unlink(file.path);
              } catch {}
            }
          }
          return res.status(404).json({ error: "Ruta no encontrada" });
        }

        // Verificar permisos - anfitrión solo puede actualizar sus propias rutas
        if (req.user!.rol === "anfitrion" && rutaActual.anfitrionId !== req.user!.userId) {
          const imagenesSubidas = (req.files?.imagen || []) as Express.Multer.File[];
          if (imagenesSubidas.length > 0) {
            const fs = await import("fs").then(m => m.promises);
            for (const file of imagenesSubidas) {
              try {
                await fs.unlink(file.path);
              } catch {}
            }
          }
          return res.status(403).json({ error: "No tienes permisos para actualizar esta ruta" });
        }

        // Preparar datos para actualizar
        const data = req.body.data ? JSON.parse(req.body.data) : req.body;
        const imagenesSubidas = (req.files?.imagen || []) as Express.Multer.File[];
        
        // Si hay nuevas imágenes, usar las nuevas; sino mantener las anteriores
        if (imagenesSubidas.length > 0) {
          const newImageUrls = imagenesSubidas.map(f => `/uploads/${f.filename}`);
          const existingImages = data.imagenes?.filter((img: string) => !img.startsWith('blob:') && !img.startsWith('data:')) || [];
          data.imagenes = [...newImageUrls, ...existingImages];
          data.imagenUrl = data.imagenes[0];

          // Eliminar imágenes anteriores locales que no estén en la nueva lista
          if (rutaActual.imagenes && rutaActual.imagenes.length > 0) {
            const fs = await import("fs").then(m => m.promises);
            for (const oldImg of rutaActual.imagenes) {
              if (oldImg.startsWith("/uploads/") && !data.imagenes.includes(oldImg)) {
                const oldImagePath = `client/public${oldImg}`;
                try {
                  await fs.unlink(oldImagePath);
                } catch {}
              }
            }
          }
        }

        const ruta = await storage.updateRuta(req.params.id, data);
        if (!ruta) {
          return res.status(404).json({ error: "Ruta no encontrada" });
        }
        res.json(ruta);
      } catch (error: any) {
        // Limpiar archivos si hay error
        if (req.files) {
          const fs = await import("fs").then(m => m.promises);
          for (const file of req.files) {
            try {
              await fs.unlink(file.path);
            } catch {}
          }
        }
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
    async (req, res) => {
      try {
        console.log("🔵 GET /api/reservas - Usuario:", req.user!.userId, "Rol:", req.user!.rol);
        
        // Si es admin, obtiene todas las reservas
        if (req.user!.rol === "admin") {
          const reservas = await storage.getAllReservas();
          console.log("🔵 Admin - Total reservas:", reservas.length);
          return res.json(reservas);
        }
        
        // Si es guía, obtiene todas las reservas
        if (req.user!.rol === "guia") {
          const reservas = await storage.getAllReservas();
          console.log("🔵 Guía - Total reservas:", reservas.length);
          return res.json(reservas);
        }
        
        // Si es anfitrión, obtiene solo las reservas de sus rutas
        if (req.user!.rol === "anfitrion") {
          const rutasDelAnfitrion = await storage.getAllRutas({});
          console.log("🔵 Total rutas en BD:", rutasDelAnfitrion.length);
          
          const misRutas = rutasDelAnfitrion.filter(r => r.anfitrionId === req.user!.userId);
          console.log("🔵 Mis rutas como anfitrión:", misRutas.length, "IDs:", misRutas.map(r => r.id));
          
          const misRutasIds = misRutas.map(r => r.id);
          
          const todasReservas = await storage.getAllReservas();
          console.log("🔵 Total reservas en BD:", todasReservas.length);
          
          const reservasDelAnfitrion = todasReservas.filter(r => misRutasIds.includes(r.rutaId));
          console.log("🔵 Reservas del anfitrión:", reservasDelAnfitrion.length);
          
          return res.json(reservasDelAnfitrion);
        }
        
        // Para otros roles, retornar error
        return res.status(403).json({ error: "No tienes permisos para acceder a las reservas" });
      } catch (error: any) {
        console.error("🔴 Error en GET /api/reservas:", error);
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
    authorizeRole(["anfitrion", "admin", "guia"]),
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
    authorizeRole(["anfitrion", "admin", "guia"]),
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

  // DELETE para cancelar reserva (turista sin motivo, anfitrión/guía con motivo - RN-07)
  app.delete("/api/reservas/:id", authenticate, async (req, res) => {
    try {
      console.log("🔵 DELETE /api/reservas/:id - ID:", req.params.id);
      console.log("🔵 Usuario:", req.user);
      console.log("🔵 Body:", req.body);
      
      const reserva = await storage.getReserva(req.params.id);
      console.log("🔵 Reserva encontrada:", reserva);
      
      if (!reserva) {
        return res.status(404).json({ error: "Reserva no encontrada" });
      }

      // RN-07: Usar método mejorado que valida motivo para anfitrión/guía
      const motivo = req.body?.motivo;
      const reservaCancelada = await storage.cancelarReserva(
        req.params.id,
        req.user!,
        motivo
      );
      
      console.log("🔵 Reserva cancelada:", reservaCancelada);

      return res.json(reservaCancelada);
    } catch (error: any) {
      console.error("🔴 Error al cancelar reserva:", error);
      return res.status(error.message.includes("permisos") ? 403 : 400).json({ 
        error: error.message || "Error al cancelar reserva" 
      });
    }
  });

  // POST para crear calificación
  app.post("/api/calificaciones", authenticate, async (req, res) => {
    try {
      const validatedData = insertCalificacionSchema.parse(req.body);
      
      // Verificar que la reserva existe y pertenece al usuario
      const reserva = await storage.getReserva(validatedData.reservaId);
      if (!reserva) {
        return res.status(404).json({ error: "Reserva no encontrada" });
      }

      if (reserva.userId !== req.user!.userId) {
        return res.status(403).json({ error: "No tienes permisos para calificar esta reserva" });
      }

      // Crear calificación
      const calificacion = await storage.createCalificacion({
        ...validatedData,
        userId: req.user!.userId,
      });

      // Recalcular rating de la ruta
      await storage.updateRutaRating(validatedData.rutaId);

      res.json(calificacion);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Error al crear calificación" });
    }
  });

  // GET para obtener calificaciones de una ruta (solo anfitrion dueño)
  app.get("/api/calificaciones/ruta/:rutaId", authenticate, async (req, res) => {
    try {
      const ruta = await storage.getRuta(req.params.rutaId);
      if (!ruta) {
        return res.status(404).json({ error: "Ruta no encontrada" });
      }

      // Verificar que el usuario es el dueño de la ruta
      if (ruta.anfitrionId !== req.user!.userId) {
        return res.status(403).json({ error: "No tienes permisos para ver estas calificaciones" });
      }

      const calificaciones = await storage.getCalificacionesPorRuta(req.params.rutaId);
      res.json(calificaciones);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Error al obtener calificaciones" });
    }
  });

  // GET para verificar si existe calificación para una reserva
  app.get("/api/calificaciones/reserva/:reservaId", authenticate, async (req, res) => {
    try {
      const reserva = await storage.getReserva(req.params.reservaId);
      if (!reserva) {
        return res.status(404).json({ error: "Reserva no encontrada" });
      }

      if (reserva.userId !== req.user!.userId) {
        return res.status(403).json({ error: "No tienes permisos para ver esto" });
      }

      const calificacion = await storage.getCalificacionPorReserva(req.params.reservaId);
      // Retornar calificación si existe, o null si no existe
      return res.json(calificacion || null);
    } catch (error: any) {
      console.error("Error en GET /api/calificaciones/reserva:", error);
      res.status(500).json({ error: error.message || "Error al obtener calificación" });
    }
  });

  // ADMIN ROUTES
  // GET lista de usuarios para admin
  app.get(
    "/api/admin/usuarios",
    authenticate,
    authorizeRole(["admin"]),
    async (req, res) => {
      try {
        const usuarios = await storage.getAllUsers();
        res.json(usuarios);
      } catch (error: any) {
        res.status(500).json({ error: error.message || "Error al obtener usuarios" });
      }
    }
  );

  // PUT suspender usuario
  app.put(
    "/api/admin/usuarios/:userId/suspender",
    authenticate,
    authorizeRole(["admin"]),
    async (req, res) => {
      try {
        const { motivo } = req.body;
        const usuario = await storage.suspenderUsuario(req.params.userId, motivo);
        
        // Registrar en auditoría
        await storage.registrarAuditLog(
          req.user!.userId,
          "suspender",
          "usuario",
          req.params.userId,
          { motivo }
        );

        res.json(usuario);
      } catch (error: any) {
        res.status(400).json({ error: error.message || "Error al suspender usuario" });
      }
    }
  );

  // PUT restaurar usuario
  app.put(
    "/api/admin/usuarios/:userId/restaurar",
    authenticate,
    authorizeRole(["admin"]),
    async (req, res) => {
      try {
        const usuario = await storage.restaurarUsuario(req.params.userId);
        
        // Registrar en auditoría
        await storage.registrarAuditLog(
          req.user!.userId,
          "restaurar",
          "usuario",
          req.params.userId,
          {}
        );

        res.json(usuario);
      } catch (error: any) {
        res.status(400).json({ error: error.message || "Error al restaurar usuario" });
      }
    }
  );

  // PUT validar rol (cambiar rol de usuario)
  app.put(
    "/api/admin/usuarios/:userId/validar-rol",
    authenticate,
    authorizeRole(["admin"]),
    async (req, res) => {
      try {
        const { nuevoRol } = req.body;
        const usuario = await storage.cambiarRolUsuario(req.params.userId, nuevoRol);
        
        // Registrar en auditoría
        await storage.registrarAuditLog(
          req.user!.userId,
          "cambiar_rol",
          "usuario",
          req.params.userId,
          { nuevoRol }
        );

        res.json(usuario);
      } catch (error: any) {
        res.status(400).json({ error: error.message || "Error al validar rol" });
      }
    }
  );

  // PUT ocultar ruta
  app.put(
    "/api/admin/rutas/:rutaId/ocultar",
    authenticate,
    authorizeRole(["admin"]),
    async (req, res) => {
      try {
        const ruta = await storage.ocultarRuta(req.params.rutaId);
        
        // Registrar en auditoría
        await storage.registrarAuditLog(
          req.user!.userId,
          "ocultar",
          "ruta",
          req.params.rutaId,
          {}
        );

        res.json(ruta);
      } catch (error: any) {
        res.status(400).json({ error: error.message || "Error al ocultar ruta" });
      }
    }
  );

  // GET audit logs
  app.get(
    "/api/admin/audit-logs",
    authenticate,
    authorizeRole(["admin"]),
    async (req, res) => {
      try {
        const logs = await storage.getAuditLogs();
        res.json(logs);
      } catch (error: any) {
        res.status(500).json({ error: error.message || "Error al obtener audit logs" });
      }
    }
  );

  // GET notificaciones del usuario
  app.get(
    "/api/notificaciones",
    authenticate,
    async (req, res) => {
      try {
        const notificaciones = await storage.getNotificaciones(req.user!.userId);
        res.json(notificaciones);
      } catch (error: any) {
        res.status(500).json({ error: error.message || "Error al obtener notificaciones" });
      }
    }
  );

  const httpServer = createServer(app);

  return httpServer;
}
