const stats = [
  { label: "Active Projects", value: "12", delta: "+2 this week" },
  { label: "Open Tasks", value: "47", delta: "11 high priority" },
  { label: "Completed", value: "128", delta: "+18 this month" },
  { label: "Team Health", value: "92%", delta: "Delivery confidence" },
];

const tasks = [
  { project: "Atlas CRM", title: "Create billing webhook", status: "Doing", owner: "You" },
  { project: "Nimbus Docs", title: "Refactor auth middleware", status: "Review", owner: "Ana" },
  { project: "Pulse Ops", title: "Ship dashboard filters", status: "Todo", owner: "Leo" },
  { project: "Helix API", title: "Rate-limit edge cases", status: "Done", owner: "You" },
];

function StatCard({ label, value, delta }: { label: string; value: string; delta: string }) {
  return (
    <article className="card stat-card">
      <p className="label">{label}</p>
      <p className="value">{value}</p>
      <p className="delta">{delta}</p>
    </article>
  );
}

export function DashboardTemplate() {
  return (
    <main className="shell">
      <aside className="sidebar">
        <div className="brand">Orbit SaaS</div>
        <nav>
          <a className="nav-item active" href="#">Overview</a>
          <a className="nav-item" href="#">Projects</a>
          <a className="nav-item" href="#">Tasks</a>
          <a className="nav-item" href="#">Analytics</a>
          <a className="nav-item" href="#">Settings</a>
        </nav>
      </aside>

      <section className="content">
        <header className="topbar card">
          <div>
            <h1>Product Delivery Hub</h1>
            <p>Track active projects, unblock critical tasks, and keep momentum.</p>
          </div>
          <button className="primary-btn">New Project</button>
        </header>

        <section className="stats-grid">
          {stats.map((stat) => (
            <StatCard key={stat.label} {...stat} />
          ))}
        </section>

        <section className="card table-wrap">
          <div className="table-head">
            <h2>Execution Queue</h2>
            <span>Today</span>
          </div>
          <table>
            <thead>
              <tr>
                <th>Project</th>
                <th>Task</th>
                <th>Status</th>
                <th>Owner</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => (
                <tr key={task.title}>
                  <td>{task.project}</td>
                  <td>{task.title}</td>
                  <td>
                    <span className={`status ${task.status.toLowerCase()}`}>{task.status}</span>
                  </td>
                  <td>{task.owner}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </section>
    </main>
  );
}
