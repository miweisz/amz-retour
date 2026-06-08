// Amazon Retour — sync service worker.
// Fetches Vendor Central returns (list + per-return ASIN + reason) across all
// marketplaces & months, then PUTs the normalized lines to the tool API.

const VC = "https://vendorcentral.amazon.fr";
const COUNTRY = { FR: "France", DE: "Allemagne", ES: "Espagne", IT: "Italie", GB: "Royaume-Uni", BE: "Belgique", NL: "Pays-Bas", PL: "Pologne", SE: "Suède" };
const MONTHS_FR = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
const REASON_LABELS = { CUSTOMER_DAMAGED: "Endommagé client", OVERSTOCK: "Surstock", DEFECTIVE: "Défectueux", CARRIER_DAMAGED: "Endommagé transporteur", WAREHOUSE_DAMAGED: "Endommagé entrepôt Amazon", NEGOTIATED_RETURN: "Retour négocié" };

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
function log(msg, pct) { chrome.runtime.sendMessage({ type: "PROGRESS", msg, pct }).catch(() => {}); }

function fmtDate(ms) {
  const d = new Date(ms), p = (n) => String(n).padStart(2, "0");
  return { date: `${p(d.getUTCDate())}/${p(d.getUTCMonth() + 1)}/${d.getUTCFullYear()}`, iso: `${d.getUTCFullYear()}-${p(d.getUTCMonth() + 1)}-${p(d.getUTCDate())}` };
}

async function getJson(url) {
  const r = await fetch(url, { headers: { accept: "application/json" }, credentials: "include" });
  const ct = r.headers.get("content-type") || "";
  if (!r.ok || !ct.includes("json")) throw new Error("bad");
  return r.json();
}

async function fetchDetail(returnId, marketplace, tries = 4) {
  for (let t = 0; t < tries; t++) {
    try { return await getJson(`${VC}/hz/vendor/members/returns/v2/returns/${returnId}?marketplace=${marketplace}`); }
    catch { await sleep(400 + t * 400); }
  }
  return null;
}

async function run(endpoint, year) {
  const now = new Date();
  const lastMonth = year < now.getFullYear() ? 12 : now.getMonth() + 1; // 1-based
  log("Lecture des codes vendeur…", 2);
  const home = await getJson(`${VC}/hz/vendor/members/returns/v2/app-data/home-page?marketplace=FR`);
  const map = home.marketscopeToVendorCodesMap || {};
  const marketplaces = Object.keys(map);

  // 1) collect returns list per marketplace/month
  const returns = [];
  let done = 0;
  const totalSteps = marketplaces.length * lastMonth;
  for (const mk of marketplaces) {
    const vc = (map[mk] || []).join(",");
    if (!vc) continue;
    for (let m = 0; m < lastMonth; m++) {
      const from = Date.UTC(year, m, 1, 0, 0, 0);
      const to = Date.UTC(year, m, new Date(year, m + 1, 0).getDate(), 23, 59, 59);
      const url = `${VC}/hz/vendor/members/returns/v2/returns?searchText=&fromDate=${from}&toDate=${to}&vendorCodes=${vc}&marketplace=${mk}&pageNumber=0&pageSize=1000`;
      try {
        const j = await getJson(url);
        for (const x of j.returns || []) returns.push({ returnId: String(x.returnId), marketplace: mk });
      } catch { /* skip */ }
      done++;
      log(`Retours ${mk} ${MONTHS_FR[m]}… (${returns.length})`, 5 + Math.round((done / totalSteps) * 25));
    }
  }
  log(`${returns.length} retours trouvés. Lecture du détail ASIN…`, 32);

  // 2) per-return ASIN + reason (throttled)
  const lines = [];
  for (let i = 0; i < returns.length; i += 4) {
    const batch = returns.slice(i, i + 4);
    const res = await Promise.all(batch.map((it) => fetchDetail(it.returnId, it.marketplace)));
    res.forEach((j, k) => {
      if (!j) return;
      const h = j.returnHeader || {};
      const { date, iso } = fmtDate(h.returnDate);
      const month = new Date(h.returnDate).getUTCMonth() + 1;
      for (const x of j.returnItems || []) {
        const qty = x.totalQuantity || 0;
        const unitCost = x.unitCost ? x.unitCost.amount : 0;
        const mk = batch[k].marketplace;
        lines.push({
          marketplace: mk, country: COUNTRY[mk] || mk, year, month, monthName: MONTHS_FR[month - 1],
          date, iso, vendorCode: h.vendorCode || "", warehouse: h.warehouse || "",
          asin: x.asin || "", ean: x.eanUpc || "", productLine: x.productLine || "",
          title: (x.title || "").replace(/[|\n\r]/g, " ").trim(),
          qty, unitCost: Math.round(unitCost * 100) / 100, lineCost: Math.round(qty * unitCost * 100) / 100,
          currency: x.unitCost ? x.unitCost.currency : "EUR",
          reason: x.reason || "", reasonLabel: REASON_LABELS[x.reason] || x.reason || "",
          returnId: batch[k].returnId,
        });
      }
    });
    await sleep(150);
    log(`Détail ASIN ${Math.min(i + 4, returns.length)}/${returns.length}…`, 32 + Math.round((i / Math.max(returns.length, 1)) * 55));
  }

  // 3) PUT to the tool
  log(`Envoi de ${lines.length} lignes au dashboard…`, 92);
  const put = await fetch(endpoint, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ lines, periodStart: `${year}-01` }) });
  const out = await put.json();
  if (!put.ok) throw new Error(out.error || "PUT failed");
  log(`✅ Terminé — ${lines.length} lignes, ${out.total} au total dans le dashboard.`, 100);
  return out;
}

chrome.runtime.onMessage.addListener((req, _sender, sendResponse) => {
  if (req.type === "SYNC") {
    run(req.endpoint, req.year)
      .then((out) => sendResponse({ ok: true, out }))
      .catch((e) => { log(`❌ Erreur : ${e.message || e}`, 100); sendResponse({ ok: false, error: String(e) }); });
    return true; // async
  }
});
