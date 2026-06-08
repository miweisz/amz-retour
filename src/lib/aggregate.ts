import type { ReturnLine } from "./types";
import { getAsinName, getAsinSku } from "./asin-catalog";

export interface MotifAgg {
  reason: string;
  reasonLabel: string;
  nLines: number;
  nReturns: number;
  qty: number;
  cost: number;
  pct: number;
}

export interface AsinAgg {
  asin: string;
  sku: string;
  nameFr: string;
  title: string;
  productLine: string;
  ean: string;
  nReturns: number;
  qty: number;
  cost: number;
  pct: number;
  mainReason: string;
  mainReasonLabel: string;
}

export interface CountryAgg {
  marketplace: string;
  country: string;
  nReturns: number;
  qty: number;
  cost: number;
}

export function kpis(lines: ReturnLine[]) {
  const returns = new Set<string>();
  let qty = 0;
  let cost = 0;
  for (const l of lines) {
    returns.add(l.returnId);
    qty += l.qty;
    cost += l.lineCost;
  }
  return { nReturns: returns.size, nLines: lines.length, qty, cost: round2(cost) };
}

export function byMotif(lines: ReturnLine[]): MotifAgg[] {
  const totalCost = lines.reduce((s, l) => s + l.lineCost, 0) || 1;
  const map = new Map<string, MotifAgg & { rid: Set<string> }>();
  for (const l of lines) {
    let m = map.get(l.reason);
    if (!m) {
      m = { reason: l.reason, reasonLabel: l.reasonLabel, nLines: 0, nReturns: 0, qty: 0, cost: 0, pct: 0, rid: new Set() };
      map.set(l.reason, m);
    }
    m.nLines += 1;
    m.qty += l.qty;
    m.cost += l.lineCost;
    m.rid.add(l.returnId);
  }
  return [...map.values()]
    .map((m) => ({ reason: m.reason, reasonLabel: m.reasonLabel, nLines: m.nLines, nReturns: m.rid.size, qty: m.qty, cost: round2(m.cost), pct: m.cost / totalCost }))
    .sort((a, b) => b.cost - a.cost);
}

export function byAsin(lines: ReturnLine[]): AsinAgg[] {
  const totalCost = lines.reduce((s, l) => s + l.lineCost, 0) || 1;
  const map = new Map<string, { title: string; productLine: string; ean: string; qty: number; cost: number; rid: Set<string>; reasons: Map<string, number>; reasonLabels: Map<string, string> }>();
  for (const l of lines) {
    let a = map.get(l.asin);
    if (!a) {
      a = { title: l.title, productLine: l.productLine, ean: l.ean, qty: 0, cost: 0, rid: new Set(), reasons: new Map(), reasonLabels: new Map() };
      map.set(l.asin, a);
    }
    a.qty += l.qty;
    a.cost += l.lineCost;
    a.rid.add(l.returnId);
    a.reasons.set(l.reason, (a.reasons.get(l.reason) || 0) + l.qty);
    a.reasonLabels.set(l.reason, l.reasonLabel);
  }
  return [...map.entries()]
    .map(([asin, a]) => {
      let mainReason = "";
      let max = -1;
      for (const [r, q] of a.reasons) if (q > max) { max = q; mainReason = r; }
      return { asin, sku: getAsinSku(asin), nameFr: getAsinName(asin, a.title), title: a.title, productLine: a.productLine, ean: a.ean, nReturns: a.rid.size, qty: a.qty, cost: round2(a.cost), pct: a.cost / totalCost, mainReason, mainReasonLabel: a.reasonLabels.get(mainReason) || mainReason };
    })
    .sort((x, y) => y.qty - x.qty);
}

export function byCountry(lines: ReturnLine[]): CountryAgg[] {
  const map = new Map<string, CountryAgg & { rid: Set<string> }>();
  for (const l of lines) {
    let c = map.get(l.marketplace);
    if (!c) {
      c = { marketplace: l.marketplace, country: l.country, nReturns: 0, qty: 0, cost: 0, rid: new Set() };
      map.set(l.marketplace, c);
    }
    c.qty += l.qty;
    c.cost += l.lineCost;
    c.rid.add(l.returnId);
  }
  return [...map.values()]
    .map((c) => ({ marketplace: c.marketplace, country: c.country, nReturns: c.rid.size, qty: c.qty, cost: round2(c.cost) }))
    .sort((a, b) => b.cost - a.cost);
}

export interface MonthAgg {
  month: number;
  monthName: string;
  qty: number;
  cost: number;
  nReturns: number;
}

export function byMonth(lines: ReturnLine[]): MonthAgg[] {
  const map = new Map<number, MonthAgg & { rid: Set<string> }>();
  for (const l of lines) {
    let m = map.get(l.month);
    if (!m) {
      m = { month: l.month, monthName: l.monthName, qty: 0, cost: 0, nReturns: 0, rid: new Set() };
      map.set(l.month, m);
    }
    m.qty += l.qty;
    m.cost += l.lineCost;
    m.rid.add(l.returnId);
  }
  return [...map.values()]
    .map(m => ({ month: m.month, monthName: m.monthName, qty: m.qty, cost: round2(m.cost), nReturns: m.rid.size }))
    .sort((a, b) => a.month - b.month);
}

export interface AsinMonthMotifAgg {
  asin: string;
  nameFr: string;
  month: number;
  monthName: string;
  reason: string;
  reasonLabel: string;
  qty: number;
  cost: number;
}

export function byAsinMonthMotif(lines: ReturnLine[]): AsinMonthMotifAgg[] {
  const map = new Map<string, AsinMonthMotifAgg>();
  for (const l of lines) {
    const key = `${l.asin}|${l.month}|${l.reason}`;
    let m = map.get(key);
    if (!m) {
      m = { asin: l.asin, nameFr: getAsinName(l.asin, l.title), month: l.month, monthName: l.monthName, reason: l.reason, reasonLabel: l.reasonLabel, qty: 0, cost: 0 };
      map.set(key, m);
    }
    m.qty += l.qty;
    m.cost += l.lineCost;
  }
  return [...map.values()].sort((a, b) => a.month - b.month || a.nameFr.localeCompare(b.nameFr));
}

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
