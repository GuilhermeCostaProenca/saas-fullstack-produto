import * as React from "react";
import { Button } from "./button";

type ModalProps = {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  children?: React.ReactNode;
};

export function Modal({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  loading = false,
  onConfirm,
  onCancel,
  children,
}: ModalProps) {
  if (!open) return null;

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-label={title}>
      <div className="modal card">
        <header className="modal-header">
          <h3>{title}</h3>
          {description ? <p>{description}</p> : null}
        </header>
        {children ? <div className="modal-body">{children}</div> : null}
        <footer className="modal-footer">
          <Button variant="ghost" onClick={onCancel} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </footer>
      </div>
    </div>
  );
}
