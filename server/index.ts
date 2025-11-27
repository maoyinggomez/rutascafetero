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
    let host = process.env.HOST || "localhost";
    
    // Si HOST es 0.0.0.0, usamos undefined para escuchar en todas las interfaces
    // Si HOST es 127.0.0.1, lo mantenemos. Si es localhost, lo mantenemos.
    if (host === "0.0.0.0") {
      host = undefined as any;
    }

    console.log(`🔌 Intentando escuchar en ${host || "todas las interfaces"}:${port}...`);
    const httpServer = host ? server.listen(port, host) : server.listen(port);

    httpServer.on('listening', () => {
      log(`✅ Servidor corriendo en http://${host}:${port}`);
    });

    // Agregar handler para errores de listen
    httpServer.on('error', (error: any) => {
      console.error("❌ Error en servidor:", error);
      process.exit(1);
    });

  } catch (error) {
    console.error("❌ Error al iniciar servidor:", error);
    process.exit(1);
  }
})();
