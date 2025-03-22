import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import session from "express-session";
import { MemoryStore } from "express-session";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Setup session middleware
app.use(
  session({
    secret: process.env.SESSION_SECRET || "tlu-steel-cutting-app-secret",
    resave: false,
    saveUninitialized: false,
    store: new MemoryStore(), // In production, use a more robust store like Redis or MongoDB
    cookie: {
      secure: process.env.NODE_ENV === "production", // Use secure cookies in production
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  })
);

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
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // Sử dụng process.env.NODE_ENV để xác định môi trường
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Define the port
  const port = 3000;
  const host = process.env.NODE_ENV === "production" ? "0.0.0.0" : "127.0.0.1";

  // Listen on the specified port and host
  server.listen(port, host, () => {
    log(`Serving on http://${host}:${port}`);
  });

  // Handle errors during server startup
  server.on("error", (error: NodeJS.ErrnoException) => {
    if (error.code === "EADDRINUSE") {
      log(`Port ${port} is already in use. Please try a different port.`);
    } else {
      log(`Failed to start server: ${error.message}`);
    }
    process.exit(1);
  });
})();