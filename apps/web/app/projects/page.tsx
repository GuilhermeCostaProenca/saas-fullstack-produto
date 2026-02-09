"use client";

import { FormEvent, useEffect, useState } from "react";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { EmptyState } from "../../components/ui/empty-state";
import { Input } from "../../components/ui/input";
import { Sidebar } from "../../components/ui/sidebar";
import { Topbar } from "../../components/ui/topbar";
import { Project, createProject, deleteProject, listProjects, updateProject } from "../../lib/api";
import { useSessionToken } from "../../lib/use-session-token";

export default function ProjectsPage() {
  const { token, loading: authLoading, logout } = useSessionToken();
  const [projects, setProjects] = useState<Project[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadProjects(currentToken: string) {
    setLoading(true);
    setError(null);
    try {
      const data = await listProjects(currentToken);
      setProjects(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load projects");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!token) return;
    loadProjects(token);
  }, [token]);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) return;
    try {
      await createProject(token, { name, description });
      setName("");
      setDescription("");
      await loadProjects(token);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create project");
    }
  }

  async function handleArchive(project: Project) {
    if (!token) return;
    await updateProject(token, project.id, { archived: !project.archived });
    await loadProjects(token);
  }

  async function handleRename(project: Project) {
    if (!token) return;
    const nextName = window.prompt("New project name", project.name);
    if (!nextName || nextName.trim().length < 2) return;
    await updateProject(token, project.id, { name: nextName.trim() });
    await loadProjects(token);
  }

  async function handleDelete(project: Project) {
    if (!token) return;
    if (!window.confirm(`Delete project '${project.name}' and all tasks?`)) return;
    await deleteProject(token, project.id);
    await loadProjects(token);
  }

  if (authLoading || loading) {
    return (
      <main className="shell">
        <section className="content">
          <EmptyState title="Loading projects" message="Fetching your workspace projects..." />
        </section>
      </main>
    );
  }

  return (
    <main className="shell">
      <Sidebar
        active="projects"
        items={[
          { id: "overview", label: "Overview", href: "/" },
          { id: "projects", label: "Projects", badge: `${projects.length}`, href: "/projects" },
          { id: "tasks", label: "Tasks", href: "/tasks" },
          { id: "settings", label: "Settings", href: "/settings" },
        ]}
      />

      <section className="content">
        <Topbar />

        <Card>
          <CardHeader>
            <CardTitle>Create project</CardTitle>
            <CardDescription>Add a new project to your workspace.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="controls" onSubmit={handleCreate}>
              <Input label="Project name" value={name} onChange={(e) => setName(e.target.value)} required />
              <Input
                label="Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Short context"
              />
              <div className="controls-action">
                <Button type="submit">Create</Button>
                <Button type="button" variant="secondary" onClick={logout}>
                  Logout
                </Button>
              </div>
            </form>
            {error ? <p className="auth-error">{error}</p> : null}
          </CardContent>
        </Card>

        {projects.length === 0 ? (
          <EmptyState title="No projects yet" message="Create your first project to start tracking tasks." />
        ) : (
          <section className="stats-grid">
            {projects.map((project) => (
              <Card key={project.id}>
                <CardHeader>
                  <CardDescription>{project.id.slice(0, 8)}</CardDescription>
                  <CardTitle>{project.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="card-description">{project.description || "No description"}</p>
                  <div className="controls-action" style={{ marginTop: 12 }}>
                    <Badge tone={project.archived ? "warning" : "success"}>{project.archived ? "Archived" : "Active"}</Badge>
                    <Button size="sm" variant="ghost" onClick={() => handleRename(project)}>
                      Rename
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleArchive(project)}>
                      {project.archived ? "Restore" : "Archive"}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDelete(project)}>
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </section>
        )}
      </section>
    </main>
  );
}
