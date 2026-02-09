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
import { DashboardSummary, Task, getDashboardSummary, listProjectTasks, listProjects } from "../lib/api";
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
        const [data, projects] = await Promise.all([getDashboardSummary(token), listProjects(token)]);
        const activeProjects = projects.filter((project) => !project.archived);
        const taskGroups = await Promise.all(activeProjects.map((project) => listProjectTasks(token, project.id)));

        const rows: DashboardTask[] = activeProjects.flatMap((project, index) =>
          taskGroups[index].map((task: Task) => ({
            id: task.id,
            project: project.name,
            task: task.title,
            status: task.status,
            priority: task.priority,
            owner: "You",
          })),
        );

        setSummary(data);
        setTasks(rows);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    }

    loadSummary();
  }, [token]);

  const metrics = [
    { label: "Active Projects", value: `${summary?.projectCount ?? "-"}`, trend: "Real data" },
    { label: "Open Tasks", value: `${summary?.taskCount ?? "-"}`, trend: "All projects" },
    { label: "Todo", value: `${summary?.byStatus.todo ?? "-"}`, trend: "Needs action" },
    { label: "Done", value: `${summary?.byStatus.done ?? "-"}`, trend: "Delivered" },
  ];

  const filteredTasks = tasks.filter((row) => {
    const matchSearch =
      search.trim().length === 0 ||
      row.project.toLowerCase().includes(search.toLowerCase()) ||
      row.task.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || row.status === statusFilter;
    const matchPriority = priorityFilter === "all" || row.priority === priorityFilter;
    return matchSearch && matchStatus && matchPriority;
  });

  const board = {
    todo: filteredTasks.filter((row) => row.status === "TODO"),
    doing: filteredTasks.filter((row) => row.status === "DOING"),
    done: filteredTasks.filter((row) => row.status === "DONE"),
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
          <Input label="Search" placeholder="Search project or task" value={search} onChange={(e) => setSearch(e.target.value)} />
          <Select
            label="Status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as "all" | "TODO" | "DOING" | "DONE")}
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
            onChange={(e) => setPriorityFilter(e.target.value as "all" | "LOW" | "MEDIUM" | "HIGH")}
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
          subtitle={`${filteredTasks.length} tasks matched your filters`}
          rows={filteredTasks}
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

        <EmptyState
          title="Ready to connect backend"
          message="This frontend template is prepared to receive real data from auth, projects, tasks and dashboard endpoints."
        />
      </section>
    </main>
  );
}
