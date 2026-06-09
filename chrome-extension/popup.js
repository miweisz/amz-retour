const $ = (id) => document.getElementById(id);

chrome.storage.local.get(["endpoint", "yearFrom", "yearTo"], (s) => {
  if (s.endpoint) $("endpoint").value = s.endpoint;
  if (s.yearFrom) $("yearFrom").value = s.yearFrom;
  if (s.yearTo) $("yearTo").value = s.yearTo;
});

chrome.runtime.onMessage.addListener((req) => {
  if (req.type === "PROGRESS") {
    $("log").textContent = req.msg;
    if (typeof req.pct === "number") $("barfill").style.width = req.pct + "%";
  }
});

async function syncYear(endpoint, year) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({ type: "SYNC", endpoint, year }, (resp) => {
      if (resp && resp.ok) resolve(resp.out);
      else reject(new Error(resp ? resp.error : "Pas de réponse"));
    });
  });
}

$("go").addEventListener("click", async () => {
  const endpoint = $("endpoint").value.trim();
  const yearFrom = parseInt($("yearFrom").value, 10) || 2025;
  const yearTo = parseInt($("yearTo").value, 10) || 2026;
  chrome.storage.local.set({ endpoint, yearFrom, yearTo });

  if (yearFrom > yearTo) {
    $("log").textContent = "❌ L'année de début doit être ≤ à l'année de fin.";
    return;
  }

  $("go").disabled = true;
  $("barfill").style.width = "0%";

  const years = [];
  for (let y = yearFrom; y <= yearTo; y++) years.push(y);

  let totalLines = 0;
  for (let i = 0; i < years.length; i++) {
    const y = years[i];
    $("log").textContent = `⏳ Synchro ${y} (${i + 1}/${years.length})…`;
    try {
      const out = await syncYear(endpoint, y);
      totalLines = out.total || totalLines;
      $("log").textContent = `✅ ${y} terminé — ${totalLines} lignes au total.`;
    } catch (e) {
      $("log").textContent = `❌ Erreur ${y} : ${e.message}`;
      $("go").disabled = false;
      return;
    }
  }

  $("go").disabled = false;
  $("log").textContent = `✅ Synchro terminée (${years.join(", ")}) — ${totalLines} lignes dans le dashboard.`;
});
