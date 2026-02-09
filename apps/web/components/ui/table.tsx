import * as React from "react";

type Column<T> = {
  key: string;
  title: string;
  render: (row: T) => React.ReactNode;
};

export function DataTable<T>({
  title,
  subtitle,
  columns,
  rows,
  emptyMessage = "No data found.",
}: {
  title: string;
  subtitle?: string;
  columns: Array<Column<T>>;
  rows: T[];
  emptyMessage?: string;
}) {
  return (
    <section className="table-wrap card">
      <header className="table-head">
        <div>
          <h3>{title}</h3>
          {subtitle ? <p>{subtitle}</p> : null}
        </div>
      </header>
      <table>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key}>{column.title}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td className="table-empty" colSpan={columns.length}>
                {emptyMessage}
              </td>
            </tr>
          ) : (
            rows.map((row, index) => (
              <tr key={index}>
                {columns.map((column) => (
                  <td key={column.key}>{column.render(row)}</td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </section>
  );
}
