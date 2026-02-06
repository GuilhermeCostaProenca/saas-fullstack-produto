import * as React from "react";
import { Button } from "./button";

export function Topbar() {
  return (
    <header className="topbar card">
      <div>
        <p className="eyebrow">Control Center</p>
        <h1>Delivery Command Dashboard</h1>
        <p className="topbar-sub">Monitor projects, unblock teams, and maintain predictable shipping.</p>
      </div>
      <div className="topbar-actions">
        <Button variant="secondary">Export</Button>
        <Button>New Project</Button>
      </div>
    </header>
  );
}
