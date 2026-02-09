"use client";

import { useEffect, useRef, useState } from "react";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { EmptyState } from "./ui/empty-state";
import { Input } from "./ui/input";
import { Select } from "./ui/select";
import { Sidebar } from "./ui/sidebar";
import { DataTable } from "./ui/table";
import { Topbar } from "./ui/topbar";
import { DashboardSummary, deleteTask, getDashboardSummary, listTasks, updateTask } from "../lib/api";
import { useSessionToken } from "../lib/use-session-token";

type DashboardTask = {
  id: string;
  project: string;
  task: string;
  status: "TODO" | "DOING" | "DONE";
  priority: "LOW" | "MEDIUM" | "HIGH";
  owner: string;
};

export function DashboardTemplate() {
  const { token, loading: authLoading, logout } = useSessionToken();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [tasks, setTasks] = useState<DashboardTask[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "TODO" | "DOING" | "DONE">("all");
  const [priorityFilter, setPriorityFilter] = useState<"all" | "LOW" | "MEDIUM" | "HIGH">("all");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busyTaskId, setBusyTaskId] = useState<string | null>(null);
  const [refreshTick, setRefreshTick] = useState(0);
  const hasLoadedOnce = useRef(false);

  useEffect(() => {
    async function loadSummary() {
      if (!token) return;

      if (!hasLoadedOnce.current) setLoading(true);
      else setRefreshing(true);
      setError(null);
      try {
        const [data, taskPage] = await Promise.all([
          getDashboardSummary(token),
          listTasks(token, {
            page,
            pageSize: 20,
            search: search || undefined,
            status: statusFilter === "all" ? undefined : statusFilter,
            priority: priorityFilter === "all" ? undefined : priorityFilter,
          }),
        ]);

        const rows: DashboardTask[] = taskPage.items.map((task) => ({
            id: task.id,
            project: task.project.name,
            task: task.title,
            status: task.status,
            priority: task.priority,
            owner: "You",
          }));

        setSummary(data);
        setTasks(rows);
        setTotalPages(taskPage.totalPages);
        hasLoadedOnce.current = true;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load dashboard");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    }

    loadSummary();
  }, [token, page, search, statusFilter, priorityFilter, refreshTick]);

  async function handleAdvance(task: DashboardTask) {
    if (!token) return;
    const nextStatus = task.status === "TODO" ? "DOING" : task.status === "DOING" ? "DONE" : "DONE";
    if (task.status === "DONE") return;
    try {
      setBusyTaskId(task.id);
      await updateTask(token, task.id, { status: nextStatus });
      setNotice(`Task moved to ${nextStatus}.`);
      setRefreshTick((value) => value + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update task");
    } finally {
      setBusyTaskId(null);
    }
  }

  async function handleDelete(task: DashboardTask) {
    if (!token) return;
    if (!window.confirm(`Delete task '${task.task}'?`)) return;
    try {
      setBusyTaskId(task.id);
      await deleteTask(token, task.id);
      setNotice("Task deleted.");
      setRefreshTick((value) => value + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to delete task");
    } finally {
      setBusyTaskId(null);
    }
  }

  const doneRate =
    summary && summary.taskCount > 0 ? `${Math.round((summary.byStatus.done / summary.taskCount) * 100)}%` : "-";
  const doingRate =
    summary && summary.taskCount > 0 ? `${Math.round((summary.byStatus.doing / summary.taskCount) * 100)}%` : "-";

  const metrics = [
    { label: "Active Projects", value: `${summary?.projectCount ?? "-"}`, trend: "Real data" },
    { label: "Open Tasks", value: `${summary?.taskCount ?? "-"}`, trend: "All projects" },
    { label: "Execution In Progress", value: doingRate, trend: "Doing / total" },
    { label: "Completion Rate", value: doneRate, trend: "Done / total" },
  ];

  const board = {
    todo: tasks.filter((row) => row.status === "TODO"),
    doing: tasks.filter((row) => row.status === "DOING"),
    done: tasks.filter((row) => row.status === "DONE"),
  };

  if (authLoading || loading) {
    return (
      <main className="shell">
        <section className="content">
          <EmptyState title="Loading dashboard" message="Fetching your workspace summary..." />
        </section>
      </main>
    );
  }

  if (error && !summary) {
    return (
      <main className="shell">
        <section className="content">
          <EmptyState title="Dashboard unavailable" message={error} />
          <Button onClick={logout}>Back to login</Button>
        </section>
      </main>
    );
  }

  return (
    <main className="shell">
      <Sidebar
        active="overview"
        items={[
          { id: "overview", label: "Overview", href: "/" },
          { id: "projects", label: "Projects", badge: `${summary?.projectCount ?? "-"}`, href: "/projects" },
          { id: "tasks", label: "Tasks", badge: `${summary?.taskCount ?? "-"}`, href: "/tasks" },
          { id: "settings", label: "Settings", href: "/settings" },
        ]}
      />

      <section className="content">
        <Topbar />

        <section className="controls card">
          <Input
            label="Search"
            placeholder="Search project or task"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
          <Select
            label="Status"
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
            value={priorityFilter}
            onChange={(e) => {
              setPriorityFilter(e.target.value as "all" | "LOW" | "MEDIUM" | "HIGH");
              setPage(1);
            }}
            options={[
              { value: "all", label: "All priorities" },
              { value: "HIGH", label: "High" },
              { value: "MEDIUM", label: "Medium" },
              { value: "LOW", label: "Low" },
            ]}
          />
          <div className="controls-action">
            {refreshing ? <Badge tone="neutral">Refreshing...</Badge> : null}
            <Button
              variant="ghost"
              onClick={() => {
                setSearch("");
                setStatusFilter("all");
                setPriorityFilter("all");
                setPage(1);
              }}
            >
              Reset
            </Button>
            <Button variant="secondary" onClick={logout}>
              Logout
            </Button>
          </div>
        </section>
        {notice ? <p className="flash flash-success">{notice}</p> : null}
        {error ? <p className="flash flash-error">{error}</p> : null}

        <section className="stats-grid">
          {metrics.map((item) => (
            <Card key={item.label} className="stat-card">
              <CardHeader>
                <CardDescription>{item.label}</CardDescription>
                <CardTitle>{item.value}</CardTitle>
              </CardHeader>
              <CardContent>
                <Badge tone={item.trend.startsWith("+") ? "success" : "warning"}>{item.trend}</Badge>
              </CardContent>
            </Card>
          ))}
        </section>

        <DataTable<DashboardTask>
          title="Execution Queue"
          subtitle={`Page ${page} with server-side filters and quick actions`}
          rows={tasks}
          emptyMessage="No tasks match the selected filters."
          columns={[
            { key: "project", title: "Project", render: (row) => row.project },
            { key: "task", title: "Task", render: (row) => row.task },
            {
              key: "status",
              title: "Status",
              render: (row) => (
                <Badge tone={row.status === "DONE" ? "success" : row.status === "DOING" ? "warning" : "neutral"}>
                  {row.status}
                </Badge>
              ),
            },
            { key: "owner", title: "Owner", render: (row) => row.owner },
            {
              key: "priority",
              title: "Priority",
              render: (row) => (
                <Badge tone={row.priority === "HIGH" ? "danger" : row.priority === "MEDIUM" ? "warning" : "success"}>
                  {row.priority}
                </Badge>
              ),
            },
            {
              key: "actions",
              title: "Actions",
              render: (row) => (
                <div className="table-actions">
                  {row.status !== "DONE" ? (
                    <Button size="sm" variant="ghost" onClick={() => handleAdvance(row)} loading={busyTaskId === row.id}>
                      Advance
                    </Button>
                  ) : null}
                  <Button size="sm" variant="ghost" onClick={() => handleDelete(row)} loading={busyTaskId === row.id}>
                    Delete
                  </Button>
                </div>
              ),
            },
          ]}
        />

        <section className="kanban-grid">
          <Card>
            <CardHeader>
              <CardTitle>Todo</CardTitle>
            </CardHeader>
            <CardContent>
              {board.todo.map((task) => (
                <p className="kanban-item" key={task.id}>
                  {task.task}
                </p>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Doing</CardTitle>
            </CardHeader>
            <CardContent>
              {board.doing.map((task) => (
                <p className="kanban-item" key={task.id}>
                  {task.task}
                </p>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Done</CardTitle>
            </CardHeader>
            <CardContent>
              {board.done.map((task) => (
                <p className="kanban-item" key={task.id}>
                  {task.task}
                </p>
              ))}
            </CardContent>
          </Card>
        </section>
        <div className="controls-action">
          <Button variant="ghost" onClick={() => setPage((prev) => Math.max(1, prev - 1))} disabled={page <= 1}>
            Previous
          </Button>
          <Badge tone="neutral">
            Page {page} / {totalPages}
          </Badge>
          <Button variant="ghost" onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))} disabled={page >= totalPages}>
            Next
          </Button>
        </div>
      </section>
    </main>
  );
}
