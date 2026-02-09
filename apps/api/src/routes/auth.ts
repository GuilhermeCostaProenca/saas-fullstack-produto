import { FastifyInstance } from "fastify";
import bcrypt from "bcryptjs";
import { prisma } from "../plugins/prisma.js";
import { loginSchema, registerSchema } from "../utils/schemas.js";

const { hash, compare } = bcrypt;

export async function authRoutes(app: FastifyInstance) {
  app.post("/auth/register", async (request, reply) => {
    const parsed = registerSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ message: "Invalid payload", issues: parsed.error.issues });
    }

    const { name, email, password } = parsed.data;
    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) {
      return reply.code(409).send({ message: "Email already in use" });
    }

    const passwordHash = await hash(password, 10);
    const user = await prisma.user.create({ data: { name, email, passwordHash } });

    const token = await reply.jwtSign({ sub: user.id, email: user.email });
    return reply.code(201).send({ token, user: { id: user.id, name: user.name, email: user.email } });
  });

  app.post("/auth/login", async (request, reply) => {
    const parsed = loginSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ message: "Invalid payload", issues: parsed.error.issues });
    }

    const { email, password } = parsed.data;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return reply.code(401).send({ message: "Invalid credentials" });

    const ok = await compare(password, user.passwordHash);
    if (!ok) return reply.code(401).send({ message: "Invalid credentials" });

    const token = await reply.jwtSign({ sub: user.id, email: user.email });
    return reply.send({ token, user: { id: user.id, name: user.name, email: user.email } });
  });
}
