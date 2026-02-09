import * as React from "react";
import Link from "next/link";

export function EmptyState({
  title,
  message,
  actionLabel,
  actionHref,
}: {
  title: string;
  message: string;
  actionLabel?: string;
  actionHref?: string;
}) {
  return (
    <div className="empty-state card">
      <h3>{title}</h3>
      <p>{message}</p>
      {actionLabel && actionHref ? (
        <Link className="empty-state-action" href={actionHref}>
          {actionLabel}
        </Link>
      ) : null}
    </div>
  );
}
