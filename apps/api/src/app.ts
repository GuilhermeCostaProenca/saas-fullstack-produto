import Fastify from "fastify";
import cors from "@fastify/cors";
import jwt from "@fastify/jwt";
import { authRoutes } from "./routes/auth.js";
import { projectRoutes } from "./routes/projects.js";
import { dashboardRoutes } from "./routes/dashboard.js";

export function createApp() {
  const app = Fastify({ logger: true });

  app.register(cors, { origin: true });
  app.register(jwt, {
    secret: process.env.JWT_SECRET ?? "change_me_dev_only",
  });

  app.get("/health", async () => ({ status: "ok" }));

  app.register(authRoutes);
  app.register(projectRoutes);
  app.register(dashboardRoutes);

  app.setErrorHandler((error, _request, reply) => {
    app.log.error(error);
    if (!reply.sent) {
      reply.code(500).send({ message: "Internal server error" });
    }
  });

  return app;
}
