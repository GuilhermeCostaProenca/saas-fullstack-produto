"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { EmptyState } from "../../components/ui/empty-state";
import { Input } from "../../components/ui/input";
import { Modal } from "../../components/ui/modal";
import { Select } from "../../components/ui/select";
import { Sidebar } from "../../components/ui/sidebar";
import { Topbar } from "../../components/ui/topbar";
import { Project, Task, createTask, deleteTask, listTasks, listProjects, updateTask } from "../../lib/api";
import { useSessionToken } from "../../lib/use-session-token";

function toIsoFromDateInput(dateValue: string) {
  return dateValue ? new Date(`${dateValue}T23:59:59`).toISOString() : undefined;
}

function isTaskOverdue(task: Task) {
  if (!task.dueDate || task.status === "DONE") return false;
  return new Date(task.dueDate).getTime() < Date.now();
}

function formatDueDate(dueDate: string | null) {
  if (!dueDate) return "No due date";
  return new Date(dueDate).toLocaleDateString();
}

export default function TasksPage() {
  const { token, loading: authLoading, logout } = useSessionToken();
  const router = useRouter();

  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState("");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<"LOW" | "MEDIUM" | "HIGH">("MEDIUM");
  const [dueDate, setDueDate] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "TODO" | "DOING" | "DONE">("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [busyTaskId, setBusyTaskId] = useState<string | null>(null);
  const [renameTaskState, setRenameTaskState] = useState<Task | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [deletingTaskState, setDeletingTaskState] = useState<Task | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const queryPage = Number(params.get("page") ?? "1");
    setPage(Number.isFinite(queryPage) && queryPage > 0 ? queryPage : 1);
    setSelectedProject(params.get("project") ?? "");
    setSearch(params.get("search") ?? "");
    setStatusFilter((params.get("status") as "all" | "TODO" | "DOING" | "DONE") ?? "all");
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    if (selectedProject) params.set("project", selectedProject);
    if (search) params.set("search", search);
    if (statusFilter !== "all") params.set("status", statusFilter);
    if (page > 1) params.set("page", String(page));
    const query = params.toString();
    router.replace(`/tasks${query ? `?${query}` : ""}`, { scroll: false });
  }, [router, selectedProject, search, statusFilter, page]);

  async function loadTasks(currentToken: string, projectId: string, nextPage = page) {
    try {
      setError(null);
      const taskData = await listTasks(currentToken, {
        projectId: projectId || undefined,
        page: nextPage,
        pageSize: 24,
        search,
        status: statusFilter === "all" ? undefined : statusFilter,
      });
      setTasks(taskData.items);
      setPage(taskData.page);
      setTotalPages(taskData.totalPages);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load tasks");
    }
  }

  async function loadProjectsAndTasks(currentToken: string, nextPage = page) {
    setLoading(true);
    setError(null);
    try {
      const projectData = await listProjects(currentToken, { page: 1, pageSize: 100, archived: "false" });
      setProjects(projectData.items);
      const selectedExists = projectData.items.some((p) => p.id === selectedProject);
      const first = selectedExists ? selectedProject : projectData.items.find((p) => !p.archived)?.id || "";
      setSelectedProject(first);
      if (first) {
        await loadTasks(currentToken, first, nextPage);
      } else {
        setTasks([]);
        setPage(1);
        setTotalPages(1);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load tasks");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!token) return;
    loadProjectsAndTasks(token, page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, search, statusFilter]);

  async function handleProjectChange(projectId: string) {
    if (!token) return;
    setSelectedProject(projectId);
    setPage(1);
    if (!projectId) {
      setTasks([]);
      setTotalPages(1);
      return;
    }
    await loadTasks(token, projectId, 1);
  }

  async function handleCreateTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token || !selectedProject) return;
    try {
      setSubmitting(true);
      setError(null);
      await createTask(token, selectedProject, { title, priority, dueDate: toIsoFromDateInput(dueDate) });
      setTitle("");
      setDueDate("");
      setNotice("Task created successfully.");
      await loadTasks(token, selectedProject, 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create task");
    } finally {
      setSubmitting(false);
    }
  }

  async function moveStatus(task: Task, status: Task["status"]) {
    if (!token) return;
    try {
      setBusyTaskId(task.id);
      setError(null);
      await updateTask(token, task.id, { status });
      setNotice(`Task moved to ${status}.`);
      await loadTasks(token, selectedProject);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update task");
    } finally {
      setBusyTaskId(null);
    }
  }

  function renameTask(task: Task) {
    setRenameTaskState(task);
    setRenameValue(task.title);
  }

  async function confirmRenameTask() {
    if (!token || !renameTaskState) return;
    const nextTitle = renameValue.trim();
    if (nextTitle.length < 2) {
      setError("Task title must have at least 2 characters.");
      return;
    }
    try {
      setBusyTaskId(renameTaskState.id);
      setError(null);
      await updateTask(token, renameTaskState.id, { title: nextTitle });
      setNotice("Task renamed.");
      await loadTasks(token, selectedProject);
      setRenameTaskState(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to rename task");
    } finally {
      setBusyTaskId(null);
    }
  }

  function removeTask(task: Task) {
    setDeletingTaskState(task);
  }

  async function confirmDeleteTask() {
    if (!token || !deletingTaskState) return;
    try {
      setBusyTaskId(deletingTaskState.id);
      setError(null);
      await deleteTask(token, deletingTaskState.id);
      setNotice("Task deleted.");
      await loadTasks(token, selectedProject, 1);
      setDeletingTaskState(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to delete task");
    } finally {
      setBusyTaskId(null);
    }
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
              <Input label="Search tasks" value={search} onChange={(e) => setSearch(e.target.value)} />
              <Input label="Due date" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
              <Select
                label="Status filter"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as "all" | "TODO" | "DOING" | "DONE");
                  setPage(1);
                }}
                options={[
                  { value: "all", label: "All statuses" },
                  { value: "TODO", label: "Todo" },
                  { value: "DOING", label: "Doing" },
                  { value: "DONE", label: "Done" },
                ]}
              />
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
                <Button type="submit" disabled={!selectedProject} loading={submitting}>
                  Create task
                </Button>
                <Button type="button" variant="secondary" onClick={logout}>
                  Logout
                </Button>
              </div>
            </form>
            {notice ? <p className="flash flash-success">{notice}</p> : null}
            {error ? <p className="flash flash-error">{error}</p> : null}
          </CardContent>
        </Card>

        {tasks.length === 0 ? (
          <EmptyState
            title="No tasks found"
            message="Create your first task or adjust filters."
            actionLabel="Go to projects"
            actionHref="/projects"
          />
        ) : (
          <section className="kanban-grid">
            <TaskColumn
              title="Todo"
              items={grouped.todo}
              onMove={moveStatus}
              onRename={renameTask}
              onDelete={removeTask}
              target="DOING"
              busyTaskId={busyTaskId}
            />
            <TaskColumn
              title="Doing"
              items={grouped.doing}
              onMove={moveStatus}
              onRename={renameTask}
              onDelete={removeTask}
              target="DONE"
              busyTaskId={busyTaskId}
            />
            <TaskColumn
              title="Done"
              items={grouped.done}
              onMove={moveStatus}
              onRename={renameTask}
              onDelete={removeTask}
              target="DONE"
              locked
              busyTaskId={busyTaskId}
            />
          </section>
        )}
        <div className="controls-action">
          <Button variant="ghost" onClick={() => token && loadTasks(token, selectedProject, Math.max(1, page - 1))} disabled={page <= 1}>
            Previous
          </Button>
          <Badge tone="neutral">
            Page {page} / {totalPages}
          </Badge>
          <Button
            variant="ghost"
            onClick={() => token && loadTasks(token, selectedProject, Math.min(totalPages, page + 1))}
            disabled={page >= totalPages}
          >
            Next
          </Button>
        </div>
        <Modal
          open={Boolean(renameTaskState)}
          title="Rename task"
          description="Use a short action-oriented title."
          confirmLabel="Save title"
          loading={Boolean(renameTaskState && busyTaskId === renameTaskState.id)}
          onCancel={() => setRenameTaskState(null)}
          onConfirm={confirmRenameTask}
        >
          <Input label="Task title" value={renameValue} onChange={(e) => setRenameValue(e.target.value)} />
        </Modal>
        <Modal
          open={Boolean(deletingTaskState)}
          title="Delete task"
          description={`This will permanently remove '${deletingTaskState?.title ?? ""}'.`}
          confirmLabel="Delete task"
          loading={Boolean(deletingTaskState && busyTaskId === deletingTaskState.id)}
          onCancel={() => setDeletingTaskState(null)}
          onConfirm={confirmDeleteTask}
        />
      </section>
    </main>
  );
}

function TaskColumn({
  title,
  items,
  onMove,
  onRename,
  onDelete,
  target,
  locked = false,
  busyTaskId,
}: {
  title: string;
  items: Task[];
  onMove: (task: Task, status: Task["status"]) => Promise<void>;
  onRename: (task: Task) => void;
  onDelete: (task: Task) => void;
  target: Task["status"];
  locked?: boolean;
  busyTaskId?: string | null;
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
            <div style={{ display: "flex", gap: 8, marginTop: 8, alignItems: "center", flexWrap: "wrap" }}>
              <Badge tone={task.priority === "HIGH" ? "danger" : task.priority === "MEDIUM" ? "warning" : "success"}>
                {task.priority}
              </Badge>
              <Badge tone={isTaskOverdue(task) ? "danger" : "neutral"}>{formatDueDate(task.dueDate)}</Badge>
              {!locked ? (
                <Button size="sm" variant="ghost" onClick={() => onMove(task, target)} loading={busyTaskId === task.id}>
                  Move
                </Button>
              ) : null}
              <Button size="sm" variant="ghost" onClick={() => onRename(task)}>
                Rename
              </Button>
              <Button size="sm" variant="ghost" onClick={() => onDelete(task)} loading={busyTaskId === task.id}>
                Delete
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
