"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { EmptyState } from "../../components/ui/empty-state";
import { Input } from "../../components/ui/input";
import { Select } from "../../components/ui/select";
import { Sidebar } from "../../components/ui/sidebar";
import { Topbar } from "../../components/ui/topbar";
import { Project, Task, createTask, listProjectTasks, listProjects, updateTask } from "../../lib/api";
import { useSessionToken } from "../../lib/use-session-token";

export default function TasksPage() {
  const { token, loading: authLoading, logout } = useSessionToken();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState("");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<"LOW" | "MEDIUM" | "HIGH">("MEDIUM");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadProjectsAndTasks(currentToken: string) {
    setLoading(true);
    setError(null);
    try {
      const projectData = await listProjects(currentToken);
      setProjects(projectData);
      const first = selectedProject || projectData.find((p) => !p.archived)?.id || "";
      setSelectedProject(first);
      if (first) {
        const taskData = await listProjectTasks(currentToken, first);
        setTasks(taskData);
      } else {
        setTasks([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load tasks");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!token) return;
    loadProjectsAndTasks(token);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function handleProjectChange(projectId: string) {
    if (!token) return;
    setSelectedProject(projectId);
    if (!projectId) {
      setTasks([]);
      return;
    }
    const taskData = await listProjectTasks(token, projectId);
    setTasks(taskData);
  }

  async function handleCreateTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token || !selectedProject) return;
    await createTask(token, selectedProject, { title, priority });
    setTitle("");
    const taskData = await listProjectTasks(token, selectedProject);
    setTasks(taskData);
  }

  async function moveStatus(task: Task, status: Task["status"]) {
    if (!token) return;
    await updateTask(token, task.id, { status });
    const taskData = await listProjectTasks(token, selectedProject);
    setTasks(taskData);
  }

  const grouped = useMemo(
    () => ({
      todo: tasks.filter((t) => t.status === "TODO"),
      doing: tasks.filter((t) => t.status === "DOING"),
      done: tasks.filter((t) => t.status === "DONE"),
    }),
    [tasks],
  );

  if (authLoading || loading) {
    return (
      <main className="shell">
        <section className="content">
          <EmptyState title="Loading tasks" message="Syncing projects and tasks..." />
        </section>
      </main>
    );
  }

  return (
    <main className="shell">
      <Sidebar
        active="tasks"
        items={[
          { id: "overview", label: "Overview", href: "/" },
          { id: "projects", label: "Projects", href: "/projects" },
          { id: "tasks", label: "Tasks", badge: `${tasks.length}`, href: "/tasks" },
          { id: "settings", label: "Settings", href: "/settings" },
        ]}
      />

      <section className="content">
        <Topbar />

        <Card>
          <CardHeader>
            <CardTitle>Task manager</CardTitle>
            <CardDescription>Create and move tasks by status.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="controls" onSubmit={handleCreateTask}>
              <Select
                label="Project"
                value={selectedProject}
                onChange={(e) => handleProjectChange(e.target.value)}
                options={[
                  { value: "", label: projects.length ? "Select project" : "No projects" },
                  ...projects.filter((p) => !p.archived).map((project) => ({ value: project.id, label: project.name })),
                ]}
              />
              <Input label="Task title" value={title} onChange={(e) => setTitle(e.target.value)} required />
              <Select
                label="Priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value as "LOW" | "MEDIUM" | "HIGH")}
                options={[
                  { value: "LOW", label: "Low" },
                  { value: "MEDIUM", label: "Medium" },
                  { value: "HIGH", label: "High" },
                ]}
              />
              <div className="controls-action">
                <Button type="submit" disabled={!selectedProject}>
                  Create task
                </Button>
                <Button type="button" variant="secondary" onClick={logout}>
                  Logout
                </Button>
              </div>
            </form>
            {error ? <p className="auth-error">{error}</p> : null}
          </CardContent>
        </Card>

        <section className="kanban-grid">
          <TaskColumn title="Todo" items={grouped.todo} onMove={moveStatus} target="DOING" />
          <TaskColumn title="Doing" items={grouped.doing} onMove={moveStatus} target="DONE" />
          <TaskColumn title="Done" items={grouped.done} onMove={moveStatus} target="DONE" locked />
        </section>
      </section>
    </main>
  );
}

function TaskColumn({
  title,
  items,
  onMove,
  target,
  locked = false,
}: {
  title: string;
  items: Task[];
  onMove: (task: Task, status: Task["status"]) => Promise<void>;
  target: Task["status"];
  locked?: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{items.length} tasks</CardDescription>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? <p className="card-description">No tasks</p> : null}
        {items.map((task) => (
          <div className="kanban-item" key={task.id}>
            <strong>{task.title}</strong>
            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <Badge tone={task.priority === "HIGH" ? "danger" : task.priority === "MEDIUM" ? "warning" : "success"}>
                {task.priority}
              </Badge>
              {!locked ? (
                <Button size="sm" variant="ghost" onClick={() => onMove(task, target)}>
                  Move
                </Button>
              ) : null}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
