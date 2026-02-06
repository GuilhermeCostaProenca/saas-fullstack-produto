import * as React from "react";

export function EmptyState({ title, message }: { title: string; message: string }) {
  return (
    <div className="empty-state card">
      <h3>{title}</h3>
      <p>{message}</p>
    </div>
  );
}
