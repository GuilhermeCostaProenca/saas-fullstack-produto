"use client";

import { FormEvent, useEffect, useState } from "react";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { EmptyState } from "../../components/ui/empty-state";
import { Input } from "../../components/ui/input";
import { Modal } from "../../components/ui/modal";
import { Sidebar } from "../../components/ui/sidebar";
import { Topbar } from "../../components/ui/topbar";
import { Project, createProject, deleteProject, listProjects, updateProject } from "../../lib/api";
import { useSessionToken } from "../../lib/use-session-token";

export default function ProjectsPage() {
  const { token, loading: authLoading, logout } = useSessionToken();
  const [projects, setProjects] = useState<Project[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [archivedFilter, setArchivedFilter] = useState<"all" | "false" | "true">("all");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [busyProjectId, setBusyProjectId] = useState<string | null>(null);
  const [renameProject, setRenameProject] = useState<Project | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [deletingProject, setDeletingProject] = useState<Project | null>(null);

  async function loadProjects(currentToken: string, nextPage = page) {
    setLoading(true);
    setError(null);
    try {
      const data = await listProjects(currentToken, {
        page: nextPage,
        pageSize: 8,
        search,
        archived: archivedFilter,
      });
      setProjects(data.items);
      setPage(data.page);
      setTotalPages(data.totalPages);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load projects");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!token) return;
    loadProjects(token, 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, search, archivedFilter]);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) return;
    try {
      setCreating(true);
      setError(null);
      await createProject(token, { name, description });
      setName("");
      setDescription("");
      setNotice("Project created successfully.");
      await loadProjects(token, 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create project");
    } finally {
      setCreating(false);
    }
  }

  async function handleArchive(project: Project) {
    if (!token) return;
    try {
      setBusyProjectId(project.id);
      setError(null);
      await updateProject(token, project.id, { archived: !project.archived });
      setNotice(project.archived ? "Project restored." : "Project archived.");
      await loadProjects(token);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update project");
    } finally {
      setBusyProjectId(null);
    }
  }

  async function handleRename(project: Project) {
    setRenameProject(project);
    setRenameValue(project.name);
  }

  async function submitRename() {
    if (!token || !renameProject) return;
    const nextName = renameValue.trim();
    if (nextName.length < 2) {
      setError("Project name must have at least 2 characters.");
      return;
    }
    try {
      setBusyProjectId(renameProject.id);
      setError(null);
      await updateProject(token, renameProject.id, { name: nextName });
      setNotice("Project renamed.");
      await loadProjects(token);
      setRenameProject(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to rename project");
    } finally {
      setBusyProjectId(null);
    }
  }

  async function handleDelete(project: Project) {
    setDeletingProject(project);
  }

  async function confirmDelete() {
    if (!token || !deletingProject) return;
    try {
      setBusyProjectId(deletingProject.id);
      setError(null);
      await deleteProject(token, deletingProject.id);
      setNotice("Project deleted.");
      await loadProjects(token, 1);
      setDeletingProject(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to delete project");
    } finally {
      setBusyProjectId(null);
    }
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
                <Button type="submit" loading={creating}>
                  Create
                </Button>
                <Button type="button" variant="secondary" onClick={logout}>
                  Logout
                </Button>
              </div>
            </form>
            <div className="controls" style={{ marginTop: 8 }}>
              <Input label="Search projects" value={search} onChange={(e) => setSearch(e.target.value)} />
              <select
                className="select"
                value={archivedFilter}
                onChange={(e) => setArchivedFilter(e.target.value as "all" | "false" | "true")}
              >
                <option value="all">All</option>
                <option value="false">Active only</option>
                <option value="true">Archived only</option>
              </select>
            </div>
            {notice ? <p className="flash flash-success">{notice}</p> : null}
            {error ? <p className="flash flash-error">{error}</p> : null}
          </CardContent>
        </Card>

        {projects.length === 0 ? (
          <EmptyState
            title="No projects yet"
            message="Create your first project to start tracking tasks."
            actionLabel="Open tasks page"
            actionHref="/tasks"
          />
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
                    <Button size="sm" variant="ghost" onClick={() => handleArchive(project)} loading={busyProjectId === project.id}>
                      {project.archived ? "Restore" : "Archive"}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDelete(project)} loading={busyProjectId === project.id}>
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </section>
        )}
        <div className="controls-action">
          <Button variant="ghost" onClick={() => token && loadProjects(token, Math.max(1, page - 1))} disabled={page <= 1}>
            Previous
          </Button>
          <Badge tone="neutral">
            Page {page} / {totalPages}
          </Badge>
          <Button
            variant="ghost"
            onClick={() => token && loadProjects(token, Math.min(totalPages, page + 1))}
            disabled={page >= totalPages}
          >
            Next
          </Button>
        </div>
      </section>
      <Modal
        open={Boolean(renameProject)}
        title="Rename project"
        description="Choose a clear and professional project name."
        confirmLabel="Save name"
        loading={Boolean(renameProject && busyProjectId === renameProject.id)}
        onCancel={() => setRenameProject(null)}
        onConfirm={submitRename}
      >
        <Input label="Project name" value={renameValue} onChange={(e) => setRenameValue(e.target.value)} />
      </Modal>
      <Modal
        open={Boolean(deletingProject)}
        title="Delete project"
        description={`This will permanently remove '${deletingProject?.name ?? ""}' and all tasks inside it.`}
        confirmLabel="Delete project"
        loading={Boolean(deletingProject && busyProjectId === deletingProject.id)}
        onCancel={() => setDeletingProject(null)}
        onConfirm={confirmDelete}
      />
    </main>
  );
}
