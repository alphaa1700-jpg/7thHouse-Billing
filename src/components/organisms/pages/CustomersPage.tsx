"use client";
import { useState } from "react";
import { Customer } from "@/types";
import { SectionTitle } from "@/components/atoms/SectionTitle";
import { Badge }        from "@/components/atoms/Badge";
import { Pagination }   from "@/components/molecules/Pagination";

const PER_PAGE = 10;
interface CustomersPageProps {
  customers: Customer[];
}
export function CustomersPage({ customers }: CustomersPageProps) {
  const [curPage, setCurPage] = useState(1);
  const goldCount    = customers.filter(c => c.tier === "Gold").length;
  const silverCount  = customers.filter(c => c.tier === "Silver").length;
  const regularCount = customers.filter(c => c.tier === "Regular").length;
  const totalCount   = customers.length;
  const tiers = [
    { icon: "👑", label: "Gold Members",    count: goldCount },
    { icon: "⭐", label: "Silver Members",  count: silverCount },
    { icon: "☕", label: "Regulars",        count: regularCount },
    { icon: "👤", label: "Total Customers", count: totalCount },
  ];
  const totalPages = Math.ceil(customers.length / PER_PAGE);
  const paginated  = customers.slice((curPage - 1) * PER_PAGE, curPage * PER_PAGE);
  return (
    <div className="animate-page-enter">
      <SectionTitle>Customers</SectionTitle>
      <div className="flex gap-3 mb-6 flex-wrap">
        {tiers.map(t => (
          <div key={t.label} className="tier-card">
            <div className="tier-card__icon">{t.icon}</div>
            <div className="tier-card__label">{t.label}</div>
            <div className="tier-card__count">{t.count}</div>
          </div>
        ))}
      </div>
      <div className="card">
        <div className="card__head">
          <div className="card__title">Customers</div>
        </div>
        {customers.length === 0 ? (
          <div style={{ padding: "2rem", textAlign: "center", color: "var(--c-cream)", fontSize: 13 }}>
            <i className="ti ti-users" style={{ fontSize: 28, display: "block", marginBottom: 6 }}/>
            No customers yet — they appear here after bills are paid
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="data-table" style={{ minWidth: 500 }}>
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Visits</th>
                    <th>Spent</th>
                    <th>Fav Item</th>
                    <th>Last Visit</th>
                    <th>Tier</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map(c => (
                    <tr key={c.name}>
                      <td style={{ color: "var(--c-cream)", fontWeight: 500 }}>{c.name}</td>
                      <td>{c.visits}</td>
                      <td style={{ color: "var(--c-c200)", fontWeight: 700 }}>{c.spent}</td>
                      <td>{c.favItem}</td>
                      <td>{c.lastVisit}</td>
                      <td>
                        <Badge variant={c.tier === "Gold" ? "amber" : c.tier === "Silver" ? "blue" : "gray"}>
                          {c.tier === "Gold" ? "👑" : c.tier === "Silver" ? "⭐" : "☕"} {c.tier}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination
              page={curPage}
              totalPages={totalPages}
              total={customers.length}
              perPage={PER_PAGE}
              onPage={setCurPage}
            />
          </>
        )}
      </div>
    </div>
  );
}