"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid,
  LineChart, Line, Legend,
} from "recharts";
import {
  RefreshCw, Download, Package, Euro, RotateCcw, Boxes, Search,
} from "lucide-react";
import type { ReturnLine, ReturnStore } from "@/lib/types";
import { byMotif, byAsin, byCountry, byMonth, byAsinMonthMotif, kpis } from "@/lib/aggregate";
import { REASON_LABELS } from "@/lib/types";
import { getAsinName as getNameFr, getAsinSku } from "@/lib/asin-catalog";

const BASE = "/amazon-retour";

const MONTHS = [
  { n: 1, label: "Jan" }, { n: 2, label: "Fév" }, { n: 3, label: "Mar" }, { n: 4, label: "Avr" },
  { n: 5, label: "Mai" }, { n: 6, label: "Juin" }, { n: 7, label: "Juil" }, { n: 8, label: "Août" },
  { n: 9, label: "Sep" }, { n: 10, label: "Oct" }, { n: 11, label: "Nov" }, { n: 12, label: "Déc" },
];

const MOTIF_COLORS: Record<string, string> = {
  CUSTOMER_DAMAGED: "#2e5496", OVERSTOCK: "#e8a838", DEFECTIVE: "#c0504d",
  CARRIER_DAMAGED: "#7f7f7f", NEGOTIATED_RETURN: "#9bbb59", WAREHOUSE_DAMAGED: "#8064a2",
};

const eur = (n: number) => n.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";
const num = (n: number) => n.toLocaleString("fr-FR");

type Tab = "motifs" | "asin" | "detail";

export default function Page() {
  const [store, setStore] = useState<ReturnStore | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("motifs");
  const [selMonths, setSelMonths] = useState<Set<number>>(new Set());
  const [selCountries, setSelCountries] = useState<Set<string>>(new Set());
  const [exporting, setExporting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const r = await fetch(`${BASE}/api/returns`, { cache: "no-store" });
      setStore(await r.json());
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const allLines = store?.lines ?? [];

  const availMonths = useMemo(() => {
    const s = new Set<number>();
    allLines.forEach((l) => s.add(l.month));
    return [...s].sort((a, b) => a - b);
  }, [allLines]);
  const availCountries = useMemo(() => {
    const m = new Map<string, string>();
    allLines.forEach((l) => m.set(l.marketplace, l.country));
    return [...m.entries()].sort();
  }, [allLines]);

  const lines = useMemo(() => {
    return allLines.filter((l) =>
      (selMonths.size === 0 || selMonths.has(l.month)) &&
      (selCountries.size === 0 || selCountries.has(l.marketplace))
    );
  }, [allLines, selMonths, selCountries]);

  const k = useMemo(() => kpis(lines), [lines]);
  const motifs = useMemo(() => byMotif(lines), [lines]);
  const asins = useMemo(() => byAsin(lines), [lines]);
  const countries = useMemo(() => byCountry(lines), [lines]);
  const months = useMemo(() => byMonth(lines), [lines]);
  const asinMonthMotif = useMemo(() => byAsinMonthMotif(lines), [lines]);
  const nAsins = useMemo(() => new Set(lines.map((l) => l.asin)).size, [lines]);

  const toggle = <T,>(set: Set<T>, v: T, upd: (s: Set<T>) => void) => {
    const n = new Set(set);
    n.has(v) ? n.delete(v) : n.add(v);
    upd(n);
  };
  const resetFilters = () => { setSelMonths(new Set()); setSelCountries(new Set()); };

  const exportXlsx = async () => {
    setExporting(true);
    try {
      const ExcelJS = (await import("exceljs")).default;
      const wb = new ExcelJS.Workbook();
      const blue = "FF2E5496";
      const head = (ws: import("exceljs").Worksheet, cols: string[]) => {
        const row = ws.addRow(cols);
        row.eachCell((c) => {
          c.font = { bold: true, color: { argb: "FFFFFFFF" }, name: "Arial", size: 10 };
          c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: blue } };
          c.alignment = { horizontal: "center", vertical: "middle" };
        });
      };
      // Motifs
      const m = wb.addWorksheet("Synthèse motifs");
      head(m, ["Motif", "Nb lignes", "Nb retours", "Quantité", "Coût (€)", "% coût"]);
      motifs.forEach((r) => m.addRow([r.reasonLabel, r.nLines, r.nReturns, r.qty, r.cost, r.pct]));
      m.addRow(["TOTAL", motifs.reduce((s, r) => s + r.nLines, 0), "", k.qty, k.cost, 1]);
      m.columns = [{ width: 26 }, { width: 12 }, { width: 12 }, { width: 12 }, { width: 14 }, { width: 10 }];
      m.getColumn(5).numFmt = '#,##0.00 "€"'; m.getColumn(6).numFmt = "0.0%";
      // ASIN
      const a = wb.addWorksheet("Synthèse ASIN");
      head(a, ["ASIN", "Produit", "Gamme", "EAN", "Nb retours", "Quantité", "Coût (€)", "% coût", "Motif principal"]);
      asins.forEach((r) => a.addRow([r.asin, r.title, r.productLine, r.ean, r.nReturns, r.qty, r.cost, r.pct, r.mainReasonLabel]));
      a.columns = [{ width: 14 }, { width: 52 }, { width: 13 }, { width: 15 }, { width: 11 }, { width: 10 }, { width: 13 }, { width: 9 }, { width: 22 }];
      a.getColumn(7).numFmt = '#,##0.00 "€"'; a.getColumn(8).numFmt = "0.0%";
      // Détail
      const d = wb.addWorksheet("Détail ASIN");
      head(d, ["Pays", "Mois", "Date", "Code vendeur", "Entrepôt", "ASIN", "Produit", "EAN", "Motif", "Quantité", "Coût unit.", "Coût ligne", "Return ID"]);
      [...lines].sort((a, b) => (a.marketplace + a.iso).localeCompare(b.marketplace + b.iso)).forEach((l) => d.addRow([l.country, l.monthName, l.date, l.vendorCode, l.warehouse, l.asin, l.title, l.ean, l.reasonLabel, l.qty, l.unitCost, l.lineCost, l.returnId]));
      d.columns = [{ width: 13 }, { width: 9 }, { width: 11 }, { width: 12 }, { width: 9 }, { width: 13 }, { width: 48 }, { width: 15 }, { width: 22 }, { width: 9 }, { width: 11 }, { width: 12 }, { width: 16 }];
      d.getColumn(11).numFmt = '#,##0.00 "€"'; d.getColumn(12).numFmt = '#,##0.00 "€"';

      const buf = await wb.xlsx.writeBuffer();
      const blob = new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Retours_Amazon_${new Date().toISOString().slice(0, 10)}.xlsx`;
      link.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div style={{ maxWidth: 1280, margin: "0 auto", padding: "24px 20px 60px" }}>
      <header style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: "var(--navy)", margin: 0 }}>Amazon Retour</h1>
          <p style={{ color: "var(--muted)", margin: "4px 0 0", fontSize: 13 }}>
            Retours Amazon Vendor Central → fournisseur · Shapeheart{store?.updatedAt ? ` · maj ${new Date(store.updatedAt).toLocaleString("fr-FR")}` : ""}
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={load} className="btn">
            <RefreshCw size={15} /> Recharger
          </button>
          <button onClick={exportXlsx} disabled={exporting || !lines.length} className="btn btn-primary">
            <Download size={15} /> {exporting ? "Export…" : "Export Excel"}
          </button>
        </div>
      </header>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 12, marginTop: 18 }}>
        <Kpi icon={<RotateCcw size={18} />} label="Retours" value={num(k.nReturns)} />
        <Kpi icon={<Boxes size={18} />} label="Unités retournées" value={num(k.qty)} />
        <Kpi icon={<Euro size={18} />} label="Coût total" value={eur(k.cost)} />
        <Kpi icon={<Package size={18} />} label="ASIN concernés" value={num(nAsins)} />
      </div>

      {/* Filters */}
      <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12, padding: 14, marginTop: 16 }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 16, alignItems: "center" }}>
          <FilterGroup label="Mois">
            {MONTHS.filter((m) => availMonths.includes(m.n)).map((m) => (
              <Chip key={m.n} active={selMonths.has(m.n)} onClick={() => toggle(selMonths, m.n, setSelMonths)}>{m.label}</Chip>
            ))}
          </FilterGroup>
          <FilterGroup label="Pays">
            {availCountries.map(([mk, name]) => (
              <Chip key={mk} active={selCountries.has(mk)} onClick={() => toggle(selCountries, mk, setSelCountries)}>{mk} · {name}</Chip>
            ))}
          </FilterGroup>
          {(selMonths.size > 0 || selCountries.size > 0) && (
            <button onClick={resetFilters} className="btn" style={{ marginLeft: "auto" }}>Réinitialiser</button>
          )}
        </div>
      </div>

      {/* Global monthly chart */}
      {!loading && <GlobalChart lines={lines} months={months} />}

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginTop: 18, borderBottom: "1px solid var(--border)" }}>
        {([["motifs", "Synthèse motifs"], ["asin", "Synthèse ASIN"], ["detail", "Détail"]] as [Tab, string][]).map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)} className={"tab" + (tab === id ? " tab-active" : "")}>{label}</button>
        ))}
      </div>

      {loading ? (
        <p style={{ color: "var(--muted)", marginTop: 24 }}>Chargement…</p>
      ) : tab === "motifs" ? (
        <MotifsTab motifs={motifs} countries={countries} totalCost={k.cost} />
      ) : tab === "asin" ? (
        <AsinTab asins={asins} asinMonthMotif={asinMonthMotif} />
      ) : (
        <DetailTab rows={lines} />
      )}

      <style>{`
        .btn { display:inline-flex; align-items:center; gap:6px; font-size:13px; font-weight:600; padding:8px 12px; border-radius:9px; border:1px solid var(--border); background:#fff; color:#374151; cursor:pointer; }
        .btn:hover { background:#f3f4f6; }
        .btn:disabled { opacity:.5; cursor:not-allowed; }
        .btn-primary { background:var(--blue); color:#fff; border-color:var(--blue); }
        .btn-primary:hover { background:#26477e; }
        .tab { padding:9px 16px; font-size:14px; font-weight:600; color:var(--muted); background:none; border:none; border-bottom:2px solid transparent; cursor:pointer; }
        .tab-active { color:var(--navy); border-bottom-color:var(--blue); }
        table { border-collapse:collapse; font-size:13px; }
        thead th { background:var(--blue); color:#fff; font-weight:600; text-align:left; padding:8px 10px; position:sticky; top:0; white-space:nowrap; }
        thead th:hover { background:#26477e; }
        tbody td { padding:7px 10px; border-bottom:1px solid #eef1f5; }
        tbody tr:nth-child(even) { background:#f8fafc; }
        .num { text-align:right; font-variant-numeric:tabular-nums; }
        .dt-search { display:flex; align-items:center; gap:8px; border:1px solid var(--border); border-radius:9px; padding:6px 10px; max-width:360px; flex:1 1 240px; }
        .resize-handle { position:absolute; right:-4px; top:0; bottom:0; width:9px; cursor:col-resize; z-index:1; }
        .resize-handle:hover { background:rgba(255,255,255,.35); }
        .resize-handle::after { content:''; position:absolute; right:4px; top:25%; bottom:25%; width:1px; background:rgba(255,255,255,.25); }
      `}</style>
    </div>
  );
}

function Kpi({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12, padding: 14 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--muted)", fontSize: 12 }}>{icon}{label}</div>
      <div style={{ fontSize: 24, fontWeight: 800, color: "var(--navy)", marginTop: 6 }}>{value}</div>
    </div>
  );
}

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <span style={{ fontSize: 12, fontWeight: 700, color: "var(--muted)" }}>{label}</span>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>{children}</div>
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} style={{
      fontSize: 12, fontWeight: 600, padding: "4px 10px", borderRadius: 999, cursor: "pointer",
      border: "1px solid " + (active ? "var(--blue)" : "var(--border)"),
      background: active ? "var(--blue)" : "#fff", color: active ? "#fff" : "#374151",
    }}>{children}</button>
  );
}

function Panel({ children }: { children: React.ReactNode }) {
  return <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12, padding: 16, marginTop: 16 }}>{children}</div>;
}

/* ─── Generic resizable / sortable / searchable table ─── */

interface Col<T> {
  key: string;
  label: string;
  numeric?: boolean;
  width: number;
  render?: (row: T) => React.ReactNode;
  sortValue?: (row: T) => string | number;
}

function DataTable<T>({ columns, data, searchPlaceholder, maxHeight = 520 }: {
  columns: Col<T>[];
  data: T[];
  searchPlaceholder?: string;
  maxHeight?: number;
}) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortAsc, setSortAsc] = useState(true);
  const [widths, setWidths] = useState<Record<string, number>>({});
  const drag = useRef<{ key: string; startX: number; startW: number } | null>(null);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!drag.current) return;
      const { key, startX, startW } = drag.current;
      setWidths(prev => ({ ...prev, [key]: Math.max(40, startW + e.clientX - startX) }));
    };
    const onUp = () => { drag.current = null; };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
    return () => { document.removeEventListener("mousemove", onMove); document.removeEventListener("mouseup", onUp); };
  }, []);

  const getVal = (row: T, key: string) => (row as Record<string, unknown>)[key];

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return data;
    return data.filter(row =>
      columns.some(c => {
        const v = getVal(row, c.key);
        return v != null && String(v).toLowerCase().includes(q);
      })
    );
  }, [data, search, columns]);

  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    const col = columns.find(c => c.key === sortKey);
    if (!col) return filtered;
    return [...filtered].sort((a, b) => {
      const va = col.sortValue ? col.sortValue(a) : getVal(a, col.key);
      const vb = col.sortValue ? col.sortValue(b) : getVal(b, col.key);
      let cmp: number;
      if (typeof va === "number" && typeof vb === "number") cmp = va - vb;
      else cmp = String(va ?? "").localeCompare(String(vb ?? ""), "fr");
      return sortAsc ? cmp : -cmp;
    });
  }, [filtered, sortKey, sortAsc, columns]);

  const toggleSort = (key: string) => {
    if (sortKey === key) setSortAsc(a => !a);
    else { setSortKey(key); setSortAsc(true); }
  };

  const totalW = columns.reduce((s, c) => s + (widths[c.key] || c.width), 0);

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10, flexWrap: "wrap" }}>
        <div className="dt-search">
          <Search size={15} color="#9ca3af" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder={searchPlaceholder || "Rechercher…"}
            style={{ border: "none", outline: "none", fontSize: 13, width: "100%", background: "transparent" }} />
        </div>
        <span style={{ fontSize: 12, color: "var(--muted)" }}>{num(sorted.length)} ligne{sorted.length !== 1 ? "s" : ""}</span>
      </div>
      <div style={{ maxHeight, overflow: "auto" }}>
        <table style={{ tableLayout: "fixed", width: totalW, minWidth: "100%" }}>
          <thead>
            <tr>
              {columns.map(c => (
                <th key={c.key} className={c.numeric ? "num" : ""}
                  style={{ width: widths[c.key] || c.width, position: "relative", cursor: "pointer", userSelect: "none" }}
                  onClick={() => toggleSort(c.key)}>
                  <span>{c.label}</span>
                  {sortKey === c.key && <span style={{ marginLeft: 4, fontSize: 10, opacity: .8 }}>{sortAsc ? "▲" : "▼"}</span>}
                  <span className="resize-handle"
                    onMouseDown={e => { e.stopPropagation(); drag.current = { key: c.key, startX: e.clientX, startW: widths[c.key] || c.width }; }} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((row, i) => (
              <tr key={i}>
                {columns.map(c => (
                  <td key={c.key} className={c.numeric ? "num" : ""} style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {c.render ? c.render(row) : (() => { const v = getVal(row, c.key); return c.numeric && typeof v === "number" ? num(v) : String(v ?? ""); })()}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

const CHART_VIEWS = [
  { key: "cost", label: "Coût (€)" },
  { key: "qty", label: "Quantité" },
  { key: "nReturns", label: "Nb retours" },
] as const;

function GlobalChart({ lines, months }: { lines: ReturnLine[]; months: ReturnType<typeof byMonth> }) {
  const [view, setView] = useState<"cost" | "qty" | "nReturns">("cost");
  const [groupBy, setGroupBy] = useState<"total" | "pays" | "motif" | "asin">("total");
  const [asinSearch, setAsinSearch] = useState("");

  const matchedAsins = useMemo(() => {
    if (groupBy !== "asin" || !asinSearch.trim()) return null;
    const q = asinSearch.trim().toLowerCase();
    const all = [...new Set(lines.map(l => l.asin))];
    return all.filter(a => a.toLowerCase().includes(q) || getNameFr(a, "").toLowerCase().includes(q) || (getAsinSku(a)).toLowerCase().includes(q));
  }, [lines, asinSearch, groupBy]);

  const filteredLines = useMemo(() => {
    if (groupBy !== "asin" || !matchedAsins) return lines;
    const set = new Set(matchedAsins);
    return lines.filter(l => set.has(l.asin));
  }, [lines, groupBy, matchedAsins]);

  const chartData = useMemo(() => {
    const palette = ["#2e5496", "#e8a838", "#c0504d", "#7f7f7f", "#9bbb59", "#8064a2", "#4bacc6", "#f79646", "#5b9bd5", "#70ad47"];
    const labelFn = (k: string) =>
      groupBy === "pays" ? k
      : groupBy === "motif" ? (REASON_LABELS[k] || k)
      : groupBy === "asin" ? getNameFr(k, k)
      : k;

    const src = groupBy === "asin" ? filteredLines : lines;

    if (groupBy === "total") {
      const data = months.map(m => ({ name: m.monthName, total: view === "cost" ? m.cost : m[view] }));
      return { data: data as Record<string, unknown>[], series: ["total"], colors: palette, labelFn };
    }
    const groupKey = groupBy === "pays" ? "marketplace" : groupBy === "motif" ? "reason" : "asin";
    const map = new Map<number, Record<string, number> & { name: string }>();
    const groups = new Set<string>();
    for (const l of src) {
      const g = l[groupKey];
      groups.add(g);
      let entry = map.get(l.month);
      if (!entry) { entry = { name: MONTHS.find(m => m.n === l.month)?.label || String(l.month) } as Record<string, number> & { name: string }; map.set(l.month, entry); }
      const val = view === "cost" ? l.lineCost : view === "qty" ? l.qty : 1;
      entry[g] = (entry[g] || 0) + val;
    }
    const data = [...map.entries()].sort((a, b) => a[0] - b[0]).map(([, v]) => v);
    return { data: data as Record<string, unknown>[], series: [...groups], colors: palette, labelFn };
  }, [lines, filteredLines, months, view, groupBy]);

  return (
    <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12, padding: 16, marginTop: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10, flexWrap: "wrap" }}>
        <h3 style={{ margin: 0, fontSize: 14, color: "var(--navy)" }}>Évolution mensuelle</h3>
        <div style={{ display: "flex", gap: 4 }}>
          {CHART_VIEWS.map(v => (
            <Chip key={v.key} active={view === v.key} onClick={() => setView(v.key)}>{v.label}</Chip>
          ))}
        </div>
        <div style={{ display: "flex", gap: 4, marginLeft: 8 }}>
          {(["total", "pays", "motif", "asin"] as const).map(g => (
            <Chip key={g} active={groupBy === g} onClick={() => { setGroupBy(g); if (g !== "asin") setAsinSearch(""); }}>{g === "total" ? "Total" : g === "pays" ? "Par pays" : g === "motif" ? "Par motif" : "Par ASIN"}</Chip>
          ))}
        </div>
        {groupBy === "asin" && (
          <div className="dt-search" style={{ maxWidth: 280 }}>
            <Search size={14} color="#9ca3af" />
            <input value={asinSearch} onChange={e => setAsinSearch(e.target.value)} placeholder="ASIN, SKU ou produit…"
              style={{ border: "none", outline: "none", fontSize: 12, width: "100%", background: "transparent" }} />
          </div>
        )}
      </div>
      <ResponsiveContainer width="100%" height={280}>
        {groupBy === "total" ? (
          <BarChart data={chartData.data} margin={{ left: 10, right: 10 }}>
            <CartesianGrid vertical={false} stroke="#eef1f5" />
            <XAxis dataKey="name" fontSize={11} />
            <YAxis fontSize={11} tickFormatter={view === "cost" ? (v) => `${Math.round(Number(v))} €` : undefined} />
            <Tooltip formatter={(v) => view === "cost" ? eur(Number(v)) : num(Number(v))} />
            <Bar dataKey="total" fill="#2e5496" radius={[4, 4, 0, 0]} name={CHART_VIEWS.find(c => c.key === view)?.label} />
          </BarChart>
        ) : (
          <LineChart data={chartData.data} margin={{ left: 10, right: 10 }}>
            <CartesianGrid vertical={false} stroke="#eef1f5" />
            <XAxis dataKey="name" fontSize={11} />
            <YAxis fontSize={11} tickFormatter={view === "cost" ? (v) => `${Math.round(Number(v))} €` : undefined} />
            <Tooltip formatter={(v) => view === "cost" ? eur(Number(v)) : num(Number(v))} labelFormatter={(l) => String(l)} />
            <Legend formatter={(v) => (chartData as { labelFn?: (k: string) => string }).labelFn?.(v) ?? v} />
            {chartData.series.map((s, i) => (
              <Line key={s} dataKey={s} stroke={chartData.colors[i % chartData.colors.length]} strokeWidth={2} dot={{ r: 3 }}
                name={s} connectNulls />
            ))}
          </LineChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}

function MotifsTab({ motifs, countries, totalCost }: { motifs: ReturnType<typeof byMotif>; countries: ReturnType<typeof byCountry>; totalCost: number }) {
  const chart = motifs.map((m) => ({ name: m.reasonLabel, cost: m.cost, reason: m.reason }));
  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 16 }}>
        <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12, padding: 16 }}>
          <h3 style={{ margin: "0 0 8px", fontSize: 14, color: "var(--navy)" }}>Coût par motif</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={chart} layout="vertical" margin={{ left: 10, right: 20 }}>
              <CartesianGrid horizontal={false} stroke="#eef1f5" />
              <XAxis type="number" tickFormatter={(v) => `${Math.round(v)} €`} fontSize={11} />
              <YAxis type="category" dataKey="name" width={150} fontSize={11} />
              <Tooltip formatter={(v) => eur(Number(v))} />
              <Bar dataKey="cost" radius={[0, 4, 4, 0]}>
                {chart.map((c) => <Cell key={c.reason} fill={MOTIF_COLORS[c.reason] || "#2e5496"} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12, padding: 16 }}>
          <h3 style={{ margin: "0 0 8px", fontSize: 14, color: "var(--navy)" }}>Coût par pays</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={countries.map((c) => ({ name: c.country, cost: c.cost }))} margin={{ left: 0, right: 10 }}>
              <CartesianGrid vertical={false} stroke="#eef1f5" />
              <XAxis dataKey="name" fontSize={11} />
              <YAxis tickFormatter={(v) => `${Math.round(v)}`} fontSize={11} />
              <Tooltip formatter={(v) => eur(Number(v))} />
              <Bar dataKey="cost" fill="#2e5496" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <Panel>
        <DataTable
          columns={[
            { key: "reasonLabel", label: "Motif", width: 200, render: (m) => <><span style={{ display: "inline-block", width: 9, height: 9, borderRadius: 2, background: MOTIF_COLORS[m.reason as string] || "#2e5496", marginRight: 8 }} />{m.reasonLabel as string}</> },
            { key: "nLines", label: "Nb lignes", numeric: true, width: 100 },
            { key: "nReturns", label: "Nb retours", numeric: true, width: 100 },
            { key: "qty", label: "Quantité", numeric: true, width: 100 },
            { key: "cost", label: "Coût", numeric: true, width: 120, render: (m) => eur(m.cost as number) },
            { key: "pct", label: "% coût", numeric: true, width: 90, render: (m) => ((m.pct as number) * 100).toFixed(1) + "%", sortValue: (m) => m.pct as number },
          ]}
          data={motifs}
          maxHeight={420}
          searchPlaceholder="Rechercher un motif…"
        />
      </Panel>
    </>
  );
}

function AsinTab({ asins, asinMonthMotif }: { asins: ReturnType<typeof byAsin>; asinMonthMotif: ReturnType<typeof byAsinMonthMotif> }) {
  const [chartSearch, setChartSearch] = useState("");

  const matchedAsin = useMemo(() => {
    const q = chartSearch.trim().toLowerCase();
    if (!q) return asins[0]?.asin ?? "";
    const found = asins.find(a =>
      a.asin.toLowerCase().includes(q) || a.sku.toLowerCase().includes(q) || a.nameFr.toLowerCase().includes(q)
    );
    return found?.asin ?? "";
  }, [asins, chartSearch]);

  const matchedLabel = useMemo(() => {
    if (!matchedAsin) return "";
    const a = asins.find(x => x.asin === matchedAsin);
    return a ? `${a.nameFr} (${a.sku})` : "";
  }, [asins, matchedAsin]);

  const chartData = useMemo(() => {
    if (!matchedAsin) return { data: [], reasons: [] };
    const rows = asinMonthMotif.filter(r => r.asin === matchedAsin);
    const reasons = [...new Set(rows.map(r => r.reason))];
    const monthMap = new Map<number, Record<string, number> & { monthName: string }>();
    for (const r of rows) {
      let entry = monthMap.get(r.month);
      if (!entry) { entry = { monthName: r.monthName } as Record<string, number> & { monthName: string }; monthMap.set(r.month, entry); }
      entry[r.reason] = (entry[r.reason] as number || 0) + r.qty;
    }
    return { data: [...monthMap.entries()].sort((a, b) => a[0] - b[0]).map(([, v]) => v), reasons };
  }, [asinMonthMotif, matchedAsin]);

  return (
    <>
      <Panel>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10, flexWrap: "wrap" }}>
          <h3 style={{ margin: 0, fontSize: 14, color: "var(--navy)" }}>Retours par mois & motif</h3>
          <div className="dt-search" style={{ maxWidth: 300 }}>
            <Search size={14} color="#9ca3af" />
            <input value={chartSearch} onChange={e => setChartSearch(e.target.value)} placeholder="ASIN, SKU ou produit…"
              style={{ border: "none", outline: "none", fontSize: 12, width: "100%", background: "transparent" }} />
          </div>
          {matchedLabel && <span style={{ fontSize: 12, color: "var(--navy)", fontWeight: 600 }}>{matchedLabel}</span>}
        </div>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={chartData.data} margin={{ left: 0, right: 10 }}>
            <CartesianGrid vertical={false} stroke="#eef1f5" />
            <XAxis dataKey="monthName" fontSize={11} />
            <YAxis fontSize={11} />
            <Tooltip />
            <Legend formatter={(v) => REASON_LABELS[v] || v} />
            {chartData.reasons.map(r => (
              <Bar key={r} dataKey={r} stackId="a" fill={MOTIF_COLORS[r] || "#2e5496"} name={r} radius={chartData.reasons.indexOf(r) === chartData.reasons.length - 1 ? [4, 4, 0, 0] : undefined} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </Panel>
      <Panel>
        <DataTable
          columns={[
            { key: "asin", label: "ASIN", width: 130, render: (a) => <span style={{ fontFamily: "monospace" }}>{a.asin as string}</span> },
            { key: "sku", label: "SKU", width: 150, render: (a) => <span style={{ fontFamily: "monospace", color: "var(--muted)" }}>{a.sku as string}</span> },
            { key: "nameFr", label: "Produit", width: 230 },
            { key: "nReturns", label: "Retours", numeric: true, width: 80 },
            { key: "qty", label: "Quantité", numeric: true, width: 80 },
            { key: "cost", label: "Coût", numeric: true, width: 110, render: (a) => eur(a.cost as number) },
            { key: "pct", label: "% coût", numeric: true, width: 75, render: (a) => ((a.pct as number) * 100).toFixed(1) + "%", sortValue: (a) => a.pct as number },
            { key: "mainReasonLabel", label: "Motif principal", width: 170 },
          ]}
          data={asins}
          searchPlaceholder="ASIN, SKU, produit, motif…"
        />
      </Panel>
    </>
  );
}

function DetailTab({ rows }: { rows: ReturnLine[] }) {
  return (
    <Panel>
      <DataTable
        columns={[
          { key: "country", label: "Pays", width: 70 },
          { key: "monthName", label: "Mois", width: 60 },
          { key: "date", label: "Date", width: 85 },
          { key: "vendorCode", label: "Vendor", width: 80 },
          { key: "warehouse", label: "Entrepôt", width: 75 },
          { key: "asin", label: "ASIN", width: 120, render: (l) => <span style={{ fontFamily: "monospace" }}>{l.asin as string}</span> },
          { key: "title", label: "Produit", width: 200, render: (l) => <span title={l.title as string}>{(l.title as string).slice(0, 40)}</span> },
          { key: "reasonLabel", label: "Motif", width: 150 },
          { key: "qty", label: "Qté", numeric: true, width: 55 },
          { key: "unitCost", label: "Coût u.", numeric: true, width: 85, render: (l) => eur(l.unitCost as number) },
          { key: "lineCost", label: "Coût", numeric: true, width: 95, render: (l) => eur(l.lineCost as number) },
          { key: "returnId", label: "Return ID", width: 130, render: (l) => <span style={{ fontFamily: "monospace", color: "var(--muted)" }}>{l.returnId as string}</span> },
        ]}
        data={rows}
        maxHeight={560}
        searchPlaceholder="ASIN, produit, return ID, entrepôt, motif…"
      />
    </Panel>
  );
}
