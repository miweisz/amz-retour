import { NextRequest, NextResponse } from "next/server";
import { loadStore, saveStore } from "@/lib/store";
import type { ReturnLine, ReturnStore } from "@/lib/types";

export const dynamic = "force-dynamic";

// CORS: the Chrome extension runs on Vendor Central pages and PUTs from there.
const ALLOWED_ORIGINS = [
  "https://vendorcentral.amazon.fr",
  "https://vendorcentral.amazon.de",
  "https://vendorcentral.amazon.es",
  "https://vendorcentral.amazon.it",
  "https://vendorcentral.amazon.co.uk",
  "https://vendorcentral.amazon.nl",
  "https://vendorcentral.amazon.se",
  "https://vendorcentral.amazon.com.be",
  "https://vendorcentral.amazon.pl",
];

function cors(origin: string | null): Record<string, string> {
  const allow = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Methods": "GET, PUT, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
  };
}

export async function OPTIONS(request: NextRequest) {
  return new Response(null, { headers: cors(request.headers.get("origin")) });
}

export async function GET(request: NextRequest) {
  const headers = cors(request.headers.get("origin"));
  return NextResponse.json(loadStore(), { headers });
}

interface PutBody {
  lines: ReturnLine[];
  periodStart?: string;
}

// Cumulative merge: any (year, month, marketplace) present in the payload replaces
// the existing lines for that period; everything else is kept.
export async function PUT(request: NextRequest) {
  const headers = cors(request.headers.get("origin"));
  try {
    const body = (await request.json()) as PutBody;
    if (!body || !Array.isArray(body.lines)) {
      return NextResponse.json({ error: "Expected { lines: [] }" }, { status: 400, headers });
    }
    const store = loadStore();
    const incomingPeriods = new Set<string>();
    for (const l of body.lines) incomingPeriods.add(`${l.year}-${l.month}-${l.marketplace}`);

    const kept = store.lines.filter((l) => !incomingPeriods.has(`${l.year}-${l.month}-${l.marketplace}`));
    const merged: ReturnStore = {
      updatedAt: new Date().toISOString(),
      periodStart: body.periodStart || store.periodStart || "2026-01",
      lines: [...kept, ...body.lines],
    };
    saveStore(merged);
    return NextResponse.json(
      { ok: true, total: merged.lines.length, replacedPeriods: [...incomingPeriods], added: body.lines.length },
      { headers }
    );
  } catch (err) {
    console.error("returns PUT failed:", err);
    return NextResponse.json({ error: String(err) }, { status: 500, headers });
  }
}
