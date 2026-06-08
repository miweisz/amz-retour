import "server-only";
import fs from "fs";
import path from "path";
import type { ReturnStore } from "./types";

// Simple JSON file store (mirrors keepa-dashboard). Data persisted in data/ on VPS.
const DATA_DIR = path.join(process.cwd(), "data");
const FILE = path.join(DATA_DIR, "returns.json");
const SEED = path.join(process.cwd(), "seed", "returns.json");

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

export function loadStore(): ReturnStore {
  ensureDir();
  try {
    return JSON.parse(fs.readFileSync(FILE, "utf-8")) as ReturnStore;
  } catch {
    // First run (data/ wiped or fresh clone): fall back to the committed seed.
    try {
      return JSON.parse(fs.readFileSync(SEED, "utf-8")) as ReturnStore;
    } catch {
      return { updatedAt: "", periodStart: "2026-01", lines: [] };
    }
  }
}

export function saveStore(store: ReturnStore): void {
  ensureDir();
  fs.writeFileSync(FILE, JSON.stringify(store), "utf-8");
}
