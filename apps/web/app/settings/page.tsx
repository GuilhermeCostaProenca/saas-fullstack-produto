"use client";

import { Sidebar } from "../../components/ui/sidebar";
import { Topbar } from "../../components/ui/topbar";
import { EmptyState } from "../../components/ui/empty-state";
import { Button } from "../../components/ui/button";
import { useSessionToken } from "../../lib/use-session-token";

export default function SettingsPage() {
  const { loading, logout } = useSessionToken();

  if (loading) {
    return (
      <main className="shell">
        <section className="content">
          <EmptyState title="Loading settings" message="Preparing account settings..." />
        </section>
      </main>
    );
  }

  return (
    <main className="shell">
      <Sidebar
        active="settings"
        items={[
          { id: "overview", label: "Overview", href: "/" },
          { id: "projects", label: "Projects", href: "/projects" },
          { id: "tasks", label: "Tasks", href: "/tasks" },
          { id: "settings", label: "Settings", href: "/settings" },
        ]}
      />
      <section className="content">
        <Topbar />
        <EmptyState title="Settings" message="Profile, preferences and workspace options will be implemented next." />
        <Button variant="secondary" onClick={logout}>
          Logout
        </Button>
      </section>
    </main>
  );
}
