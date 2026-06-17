// src/components/molecules/Pagination.tsx
interface PaginationProps {
  page:       number;
  totalPages: number;
  total:      number;
  perPage:    number;
  onPage:     (p: number) => void;
}

export function Pagination({ page, totalPages, total, perPage, onPage }: PaginationProps) {
  if (totalPages <= 1) return null;

  const from = (page - 1) * perPage + 1;
  const to   = Math.min(page * perPage, total);

  const pages: (number | "…")[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (page > 3)           pages.push("…");
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i);
    if (page < totalPages - 2) pages.push("…");
    pages.push(totalPages);
  }

  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "12px 16px", borderTop: "1px solid #1e1008",
      fontFamily: "DM Sans, sans-serif",
    }}>
      <span style={{ fontSize: 12, color: "#2c1a0e" }}>
        Showing <strong style={{ color: "#6b4a2a" }}>{from}–{to}</strong> of{" "}
        <strong style={{ color: "#6b4a2a" }}>{total}</strong>
      </span>

      <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
        <button
          onClick={() => onPage(page - 1)}
          disabled={page === 1}
          style={btnStyle(false, page === 1)}
        >
          <i className="ti ti-chevron-left" style={{ fontSize: 13 }}/>
        </button>

        {pages.map((p, i) =>
          p === "…" ? (
            <span key={`ellipsis-${i}`} style={{ color: "#2c1a0e", fontSize: 12, padding: "0 2px" }}>…</span>
          ) : (
            <button
              key={p}
              onClick={() => onPage(p as number)}
              style={btnStyle(p === page, false)}
            >
              {p}
            </button>
          )
        )}

        <button
          onClick={() => onPage(page + 1)}
          disabled={page === totalPages}
          style={btnStyle(false, page === totalPages)}
        >
          <i className="ti ti-chevron-right" style={{ fontSize: 13 }}/>
        </button>
      </div>
    </div>
  );
}

function btnStyle(active: boolean, disabled: boolean): React.CSSProperties {
  return {
    minWidth: 28, height: 28, borderRadius: 6,
    border: active ? "1px solid #C8874A" : "1px solid #2a1a0a",
    background: active ? "rgba(200,135,74,0.15)" : "transparent",
    color: active ? "#C8761A" : disabled ? "#c8ad88" : "#6b4a2a",
    fontSize: 12, fontWeight: active ? 700 : 400,
    cursor: disabled ? "not-allowed" : "pointer",
    display: "flex", alignItems: "center", justifyContent: "center",
    transition: "all 0.15s",
  };
}