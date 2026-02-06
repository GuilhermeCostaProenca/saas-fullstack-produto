import { FastifyInstance } from "fastify";
import { prisma } from "../plugins/prisma.js";
import { authenticate } from "../utils/auth.js";

export async function dashboardRoutes(app: FastifyInstance) {
  app.get("/dashboard/summary", { preHandler: [authenticate] }, async (request) => {
    const userId = request.user.sub as string;

    const [projectCount, taskCount, doneCount, doingCount, todoCount] = await Promise.all([
      prisma.project.count({ where: { userId, archived: false } }),
      prisma.task.count({ where: { project: { userId } } }),
      prisma.task.count({ where: { project: { userId }, status: "DONE" } }),
      prisma.task.count({ where: { project: { userId }, status: "DOING" } }),
      prisma.task.count({ where: { project: { userId }, status: "TODO" } }),
    ]);

    return {
      projectCount,
      taskCount,
      byStatus: {
        todo: todoCount,
        doing: doingCount,
        done: doneCount,
      },
    };
  });
}
