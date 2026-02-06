import * as React from "react";
import Link from "next/link";

export function Sidebar({
  items,
  active,
}: {
  items: Array<{ id: string; label: string; href?: string; badge?: string }>;
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
          <Link
            key={item.id}
            className={`nav-item ${active === item.id ? "active" : ""}`.trim()}
            href={item.href ?? "#"}
          >
            <span>{item.label}</span>
            {item.badge ? <strong>{item.badge}</strong> : null}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
