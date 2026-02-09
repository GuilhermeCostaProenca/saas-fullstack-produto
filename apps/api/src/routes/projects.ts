import { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../plugins/prisma.js";
import { authenticate } from "../utils/auth.js";
import { projectCreateSchema, projectUpdateSchema, taskCreateSchema, taskUpdateSchema } from "../utils/schemas.js";

const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(12),
});

const projectListQuerySchema = paginationSchema.extend({
  search: z.string().trim().optional(),
  archived: z.enum(["all", "true", "false"]).default("false"),
});

const taskListQuerySchema = paginationSchema.extend({
  search: z.string().trim().optional(),
  status: z.enum(["TODO", "DOING", "DONE"]).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
});

export async function projectRoutes(app: FastifyInstance) {
  app.get("/projects", { preHandler: [authenticate] }, async (request, reply) => {
    const parsedQuery = projectListQuerySchema.safeParse(request.query);
    if (!parsedQuery.success) {
      return reply.code(400).send({ message: "Invalid query", issues: parsedQuery.error.issues });
    }

    const userId = request.user.sub as string;
    const { search, archived, page, pageSize } = parsedQuery.data;

    const where = {
      userId,
      ...(archived === "all" ? {} : { archived: archived === "true" }),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" as const } },
              { description: { contains: search, mode: "insensitive" as const } },
            ],
          }
        : {}),
    };

    const [total, items] = await Promise.all([
      prisma.project.count({ where }),
      prisma.project.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    };
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

  app.delete("/projects/:id", { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const userId = request.user.sub as string;
    const project = await prisma.project.findFirst({ where: { id, userId } });
    if (!project) return reply.code(404).send({ message: "Project not found" });

    await prisma.project.delete({ where: { id } });
    return reply.code(204).send();
  });

  app.get("/projects/:id/tasks", { preHandler: [authenticate] }, async (request, reply) => {
    const parsedQuery = taskListQuerySchema.safeParse(request.query);
    if (!parsedQuery.success) {
      return reply.code(400).send({ message: "Invalid query", issues: parsedQuery.error.issues });
    }

    const { id } = request.params as { id: string };
    const userId = request.user.sub as string;
    const { search, status, priority, page, pageSize } = parsedQuery.data;

    const project = await prisma.project.findFirst({ where: { id, userId } });
    if (!project) return reply.code(404).send({ message: "Project not found" });

    const where = {
      projectId: id,
      ...(status ? { status } : {}),
      ...(priority ? { priority } : {}),
      ...(search
        ? {
            OR: [
              { title: { contains: search, mode: "insensitive" as const } },
              { description: { contains: search, mode: "insensitive" as const } },
            ],
          }
        : {}),
    };

    const [total, items] = await Promise.all([
      prisma.task.count({ where }),
      prisma.task.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    };
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

  app.delete("/tasks/:id", { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const userId = request.user.sub as string;
    const task = await prisma.task.findFirst({ where: { id }, include: { project: true } });
    if (!task || task.project.userId !== userId) return reply.code(404).send({ message: "Task not found" });

    await prisma.task.delete({ where: { id } });
    return reply.code(204).send();
  });

  app.get("/tasks", { preHandler: [authenticate] }, async (request, reply) => {
    const parsedQuery = taskListQuerySchema
      .extend({
        projectId: z.string().uuid().optional(),
      })
      .safeParse(request.query);

    if (!parsedQuery.success) {
      return reply.code(400).send({ message: "Invalid query", issues: parsedQuery.error.issues });
    }

    const userId = request.user.sub as string;
    const { projectId, search, status, priority, page, pageSize } = parsedQuery.data;

    const where = {
      project: {
        userId,
      },
      ...(projectId ? { projectId } : {}),
      ...(status ? { status } : {}),
      ...(priority ? { priority } : {}),
      ...(search
        ? {
            OR: [
              { title: { contains: search, mode: "insensitive" as const } },
              { description: { contains: search, mode: "insensitive" as const } },
              { project: { name: { contains: search, mode: "insensitive" as const } } },
            ],
          }
        : {}),
    };

    const [total, items] = await Promise.all([
      prisma.task.count({ where }),
      prisma.task.findMany({
        where,
        include: {
          project: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    };
  });
}
