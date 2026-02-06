const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3333";

export type AuthResponse = {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
};

export type DashboardSummary = {
  projectCount: number;
  taskCount: number;
  byStatus: {
    todo: number;
    doing: number;
    done: number;
  };
};

export type Project = {
  id: string;
  name: string;
  description: string | null;
  archived: boolean;
  createdAt: string;
};

export type Task = {
  id: string;
  title: string;
  description: string | null;
  status: "TODO" | "DOING" | "DONE";
  priority: "LOW" | "MEDIUM" | "HIGH";
  dueDate: string | null;
  projectId: string;
  createdAt: string;
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    const data = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new Error(data?.message ?? "Request failed");
  }

  return response.json() as Promise<T>;
}

export async function register(payload: { name: string; email: string; password: string }) {
  return request<AuthResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function login(payload: { email: string; password: string }) {
  return request<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getDashboardSummary(token: string) {
  return request<DashboardSummary>("/dashboard/summary", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function listProjects(token: string) {
  return request<Project[]>("/projects", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function createProject(
  token: string,
  payload: {
    name: string;
    description?: string;
  },
) {
  return request<Project>("/projects", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
}

export async function updateProject(
  token: string,
  projectId: string,
  payload: {
    name?: string;
    description?: string | null;
    archived?: boolean;
  },
) {
  return request<Project>(`/projects/${projectId}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
}

export async function listProjectTasks(token: string, projectId: string) {
  return request<Task[]>(`/projects/${projectId}/tasks`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function createTask(
  token: string,
  projectId: string,
  payload: {
    title: string;
    description?: string;
    priority?: "LOW" | "MEDIUM" | "HIGH";
    status?: "TODO" | "DOING" | "DONE";
  },
) {
  return request<Task>(`/projects/${projectId}/tasks`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
}

export async function updateTask(
  token: string,
  taskId: string,
  payload: {
    title?: string;
    description?: string | null;
    priority?: "LOW" | "MEDIUM" | "HIGH";
    status?: "TODO" | "DOING" | "DONE";
  },
) {
  return request<Task>(`/tasks/${taskId}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
}

export const TOKEN_KEY = "saas_token";
