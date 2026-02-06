import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { EmptyState } from "./ui/empty-state";
import { Input } from "./ui/input";
import { Select } from "./ui/select";
import { Sidebar } from "./ui/sidebar";
import { DataTable } from "./ui/table";
import { Topbar } from "./ui/topbar";

const metrics = [
  { label: "MRR", value: "$42.8k", trend: "+12.4%" },
  { label: "Active Projects", value: "19", trend: "+3" },
  { label: "Tasks In Progress", value: "58", trend: "-4" },
  { label: "SLA Compliance", value: "96%", trend: "+1.8%" },
];

const queue = [
  { project: "Atlas CRM", task: "Implement billing webhooks", status: "Doing", owner: "You", risk: "Low" },
  { project: "Nimbus Docs", task: "Refactor auth middleware", status: "Review", owner: "Ana", risk: "Medium" },
  { project: "Helix API", task: "Stabilize rate limiter", status: "Todo", owner: "Leo", risk: "High" },
  { project: "Pulse Ops", task: "Dashboard conversion tracking", status: "Done", owner: "You", risk: "Low" },
];
type QueueItem = (typeof queue)[number];

const board = {
  todo: ["Define workspace onboarding", "Map recurring task templates"],
  doing: ["Auth flows end-to-end", "Dashboard API contracts"],
  done: ["Foundation tokens", "CI baseline checks"],
};

export function DashboardTemplate() {
  return (
    <main className="shell">
      <Sidebar
        active="overview"
        items={[
          { id: "overview", label: "Overview" },
          { id: "projects", label: "Projects", badge: "19" },
          { id: "tasks", label: "Tasks", badge: "58" },
          { id: "analytics", label: "Analytics" },
          { id: "settings", label: "Settings" },
        ]}
      />

      <section className="content">
        <Topbar />

        <section className="controls card">
          <Input label="Search" placeholder="Search project or task" />
          <Select
            label="Status"
            defaultValue="all"
            options={[
              { value: "all", label: "All statuses" },
              { value: "todo", label: "Todo" },
              { value: "doing", label: "Doing" },
              { value: "done", label: "Done" },
            ]}
          />
          <Select
            label="Priority"
            defaultValue="all"
            options={[
              { value: "all", label: "All priorities" },
              { value: "high", label: "High" },
              { value: "medium", label: "Medium" },
              { value: "low", label: "Low" },
            ]}
          />
          <div className="controls-action">
            <Button variant="ghost">Reset</Button>
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

        <DataTable<QueueItem>
          title="Execution Queue"
          subtitle="Critical cross-team tasks for today"
          rows={queue}
          columns={[
            { key: "project", title: "Project", render: (row) => row.project },
            { key: "task", title: "Task", render: (row) => row.task },
            {
              key: "status",
              title: "Status",
              render: (row) => (
                <Badge tone={row.status === "Done" ? "success" : row.status === "Doing" ? "warning" : "neutral"}>
                  {row.status}
                </Badge>
              ),
            },
            { key: "owner", title: "Owner", render: (row) => row.owner },
            {
              key: "risk",
              title: "Risk",
              render: (row) => (
                <Badge tone={row.risk === "High" ? "danger" : row.risk === "Medium" ? "warning" : "success"}>{row.risk}</Badge>
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
                <p className="kanban-item" key={task}>{task}</p>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Doing</CardTitle>
            </CardHeader>
            <CardContent>
              {board.doing.map((task) => (
                <p className="kanban-item" key={task}>{task}</p>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Done</CardTitle>
            </CardHeader>
            <CardContent>
              {board.done.map((task) => (
                <p className="kanban-item" key={task}>{task}</p>
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
