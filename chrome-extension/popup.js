const $ = (id) => document.getElementById(id);

chrome.storage.local.get(["endpoint", "year"], (s) => {
  if (s.endpoint) $("endpoint").value = s.endpoint;
  if (s.year) $("year").value = s.year;
});

chrome.runtime.onMessage.addListener((req) => {
  if (req.type === "PROGRESS") {
    $("log").textContent = req.msg;
    if (typeof req.pct === "number") $("barfill").style.width = req.pct + "%";
  }
});

$("go").addEventListener("click", () => {
  const endpoint = $("endpoint").value.trim();
  const year = parseInt($("year").value, 10) || new Date().getFullYear();
  chrome.storage.local.set({ endpoint, year });
  $("go").disabled = true;
  $("log").textContent = "Démarrage…";
  $("barfill").style.width = "0%";
  chrome.runtime.sendMessage({ type: "SYNC", endpoint, year }, (resp) => {
    $("go").disabled = false;
    if (resp && resp.ok) $("log").textContent = `✅ Terminé — ${resp.out.total} lignes dans le dashboard.`;
    else if (resp) $("log").textContent = `❌ ${resp.error}`;
  });
});
