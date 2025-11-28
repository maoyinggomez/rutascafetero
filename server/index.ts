import 'dotenv/config';
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();

declare module 'http' {
  interface IncomingMessage {
    rawBody: unknown
  }
}
app.use(express.json({
  verify: (req, _res, buf) => {
    req.rawBody = buf;
  },
  limit: '50mb',
}));
app.use(express.urlencoded({ extended: false, limit: '50mb' }));

// CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Servir archivos estáticos de uploads
app.use('/uploads', express.static('client/public/uploads'));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  try {
    console.log("🚀 Iniciando servidor...");
    const server = await registerRoutes(app);
    console.log("✅ Routes registradas");

    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";

      res.status(status).json({ message });
      throw err;
    });
    console.log("✅ Error handler registrado");

    // importantly only setup vite in development and after
    // setting up all the other routes so the catch-all route
    // doesn't interfere with the other routes
    if (app.get("env") === "development") {
      console.log("🔧 Configurando Vite...");
      await setupVite(app, server);
      console.log("✅ Vite configurado");
    } else {
      console.log("📁 Sirviendo archivos estáticos...");
      serveStatic(app);
      console.log("✅ Archivos estáticos configurados");
    }

    // ALWAYS serve the app on the port specified in the environment variable PORT
    // Other ports are firewalled. Default to 5000 if not specified.
    // this serves both the API and the client.
    // It is the only port that is not firewalled.
    const port = parseInt(process.env.PORT || '5000', 10);
    const hostEnv = process.env.HOST || "localhost";
    
    // En Windows, es más seguro usar "localhost" en lugar de 0.0.0.0
    // localhost escucha en ambas 127.0.0.1 y ::1 (IPv6)
    const listenHost = hostEnv === "0.0.0.0" ? "localhost" : hostEnv;

    console.log(`🔌 Intentando escuchar en ${listenHost}:${port}...`);
    server.listen(port, listenHost, () => {
      log(`✅ Servidor corriendo en http://${listenHost}:${port}`);
      console.log("🟢 Servidor completamente listo para recibir solicitudes");
    });

    // Agregar handler para errores de listen
    server.on('error', (error: any) => {
      console.error("❌ Error en servidor:", error);
      process.exit(1);
    });

    // Evitar que Node.js salga del proceso
    console.log("🔄 Servidor en standby, esperando solicitudes...");

    // Mantener el proceso activo - setInterval hace que Node.js no salga
    setInterval(() => {}, 1000000);

  } catch (error) {
    console.error("❌ Error al iniciar servidor:", error);
    console.error("Stack:", (error as any).stack);
    process.exit(1);
  }
})();

// Handler para excepciones no capturadas
process.on('uncaughtException', (error) => {
  console.error('❌ Excepción no capturada:', error);
  // NO hacer exit, solo loguear
  // process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Promesa rechazada no manejada:', reason);
  // NO hacer exit, solo loguear
});

// Ignorar SIGINT y SIGTERM para que el servidor siga funcionando
// NO logueamos porque eso causa que npm intente salir
process.on('SIGINT', () => {
  // Ignorar silenciosamente
});

process.on('SIGTERM', () => {
  // Ignorar silenciosamente
});
