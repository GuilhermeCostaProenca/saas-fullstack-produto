import { FastifyInstance } from "fastify";
import { prisma } from "../plugins/prisma.js";
import { authenticate } from "../utils/auth.js";
import { projectCreateSchema, projectUpdateSchema, taskCreateSchema, taskUpdateSchema } from "../utils/schemas.js";

export async function projectRoutes(app: FastifyInstance) {
  app.get("/projects", { preHandler: [authenticate] }, async (request) => {
    const userId = request.user.sub as string;
    return prisma.project.findMany({ where: { userId }, orderBy: { createdAt: "desc" } });
  });

  app.post("/projects", { preHandler: [authenticate] }, async (request, reply) => {
    const parsed = projectCreateSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ message: "Invalid payload", issues: parsed.error.issues });

    const userId = request.user.sub as string;
    const project = await prisma.project.create({ data: { userId, ...parsed.data } });
    return reply.code(201).send(project);
  });

  app.patch("/projects/:id", { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const parsed = projectUpdateSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ message: "Invalid payload", issues: parsed.error.issues });

    const userId = request.user.sub as string;
    const project = await prisma.project.findFirst({ where: { id, userId } });
    if (!project) return reply.code(404).send({ message: "Project not found" });

    const updated = await prisma.project.update({ where: { id }, data: parsed.data });
    return updated;
  });

  app.get("/projects/:id/tasks", { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const userId = request.user.sub as string;

    const project = await prisma.project.findFirst({ where: { id, userId } });
    if (!project) return reply.code(404).send({ message: "Project not found" });

    return prisma.task.findMany({ where: { projectId: id }, orderBy: { createdAt: "desc" } });
  });

  app.post("/projects/:id/tasks", { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const parsed = taskCreateSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ message: "Invalid payload", issues: parsed.error.issues });

    const userId = request.user.sub as string;
    const project = await prisma.project.findFirst({ where: { id, userId } });
    if (!project) return reply.code(404).send({ message: "Project not found" });

    const task = await prisma.task.create({
      data: {
        ...parsed.data,
        dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : undefined,
        projectId: id,
      },
    });

    return reply.code(201).send(task);
  });

  app.patch("/tasks/:id", { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const parsed = taskUpdateSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ message: "Invalid payload", issues: parsed.error.issues });

    const userId = request.user.sub as string;
    const task = await prisma.task.findFirst({ where: { id }, include: { project: true } });
    if (!task || task.project.userId !== userId) return reply.code(404).send({ message: "Task not found" });

    const updated = await prisma.task.update({
      where: { id },
      data: {
        ...parsed.data,
        dueDate: parsed.data.dueDate === null ? null : parsed.data.dueDate ? new Date(parsed.data.dueDate) : undefined,
      },
    });

    return updated;
  });
}
