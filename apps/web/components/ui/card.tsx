import * as React from "react";

type CardProps = {
  children: React.ReactNode;
  className?: string;
};

export function Card({ children, className = "" }: CardProps) {
  return <article className={`card ${className}`.trim()}>{children}</article>;
}

export function CardHeader({ children }: { children: React.ReactNode }) {
  return <header className="card-header">{children}</header>;
}

export function CardTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="card-title">{children}</h3>;
}

export function CardDescription({ children }: { children: React.ReactNode }) {
  return <p className="card-description">{children}</p>;
}

export function CardContent({ children }: { children: React.ReactNode }) {
  return <div className="card-content">{children}</div>;
}
