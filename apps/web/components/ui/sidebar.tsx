import * as React from "react";

export function Sidebar({
  items,
  active,
}: {
  items: Array<{ id: string; label: string; badge?: string }>;
  active: string;
}) {
  return (
    <aside className="sidebar">
      <div className="brand-wrap">
        <div className="brand-mark" />
        <div>
          <p className="brand-kicker">Premium Workspace</p>
          <h2 className="brand">Orbit Flow</h2>
        </div>
      </div>
      <nav>
        {items.map((item) => (
          <a key={item.id} className={`nav-item ${active === item.id ? "active" : ""}`.trim()} href="#">
            <span>{item.label}</span>
            {item.badge ? <strong>{item.badge}</strong> : null}
          </a>
        ))}
      </nav>
    </aside>
  );
}
