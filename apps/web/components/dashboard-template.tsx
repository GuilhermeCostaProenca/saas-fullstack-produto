"use client";

import { useEffect, useState } from "react";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { EmptyState } from "./ui/empty-state";
import { Input } from "./ui/input";
import { Select } from "./ui/select";
import { Sidebar } from "./ui/sidebar";
import { DataTable } from "./ui/table";
import { Topbar } from "./ui/topbar";
import { DashboardSummary, getDashboardSummary, listTasks } from "../lib/api";
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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadSummary() {
      if (!token) return;

      setLoading(true);
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
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    }

    loadSummary();
  }, [token, page, search, statusFilter, priorityFilter]);

  const metrics = [
    { label: "Active Projects", value: `${summary?.projectCount ?? "-"}`, trend: "Real data" },
    { label: "Open Tasks", value: `${summary?.taskCount ?? "-"}`, trend: "All projects" },
    { label: "Todo", value: `${summary?.byStatus.todo ?? "-"}`, trend: "Needs action" },
    { label: "Done", value: `${summary?.byStatus.done ?? "-"}`, trend: "Delivered" },
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

  if (error) {
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
          subtitle={`Page ${page} with server-side filters`}
          rows={tasks}
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

        <EmptyState
          title="Server-side filters enabled"
          message="Search, status, priority and pagination now run in the backend."
        />
      </section>
    </main>
  );
}
