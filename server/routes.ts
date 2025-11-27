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
      });
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
      const validatedData = insertReservaSchema.parse(req.body);
      
      const ruta = await storage.getRuta(validatedData.rutaId);
      if (!ruta) {
        return res.status(404).json({ error: "Ruta no encontrada" });
      }

      const reserva = await storage.createReserva({
        ...validatedData,
        userId: req.user!.userId,
      });

      res.status(201).json(reserva);
    } catch (error: any) {
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

  const httpServer = createServer(app);

  return httpServer;
}
