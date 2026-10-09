(() => {
  const labels = {
    water:"Traitement d'eau", surchauffee:"Eau surchauffée", vapeur:"Chaudière vapeur",
    vide:"Pompe à vide", compresseurs:"Compresseurs", glacee:"Eau glacée - Trane",
    chiller:"Eau glacée - Chiller", york:"Eau glacée - York", thermo:"Thermoventilation",
    groupes:"Groupes électrogènes", osmose:"Station d'osmose"
  };
  const escapeHtml = value => String(value ?? "").replace(/[&<>"']/g, c => ({
    "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;"
  })[c]);
  const dateLabel = value => {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString("fr-FR");
  };
  let commentRows = [];
  let sortKey = "date";
  let sortDirection = "desc";

  function valueFor(row, key) {
    return key === "date" ? row.date || "" : String(row[key] ?? "");
  }
  function matchesFilter(row, key, filter) {
    const value = key === "date" ? dateLabel(row.date) : valueFor(row, key);
    return value.toLocaleLowerCase("fr-FR").includes(filter.toLocaleLowerCase("fr-FR"));
  }
  function renderHeader() {
    const head = document.getElementById("comments-thead");
    if (!head) return;
    const previous = new Map([...head.querySelectorAll("[data-comment-filter]")].map(input => [input.dataset.commentFilter, input.value]));
    const columns = [["date","Date et heure"],["technician","Technicien"],["utility","Utilité"],["comment","Commentaire"]];
    const firstRow = columns.map(([key,label]) => {
      const indicator = sortKey === key ? (sortDirection === "asc" ? " ▲" : " ▼") : "";
      return '<th><button class="history-sort" type="button" data-comment-sort="' + key + '">' + label + indicator + '</button></th>';
    }).join("");
    const secondRow = columns.map(([key,label]) => '<th><input class="history-column-filter" type="search" data-comment-filter="' + key +
      '" aria-label="Filtrer ' + label + '" placeholder="Filtrer" value="' + escapeHtml(previous.get(key) || "") + '"></th>').join("");
    head.innerHTML = "<tr>" + firstRow + "</tr><tr>" + secondRow + "</tr>";
  }
  function renderComments() {
    const body = document.getElementById("comments-body");
    const info = document.getElementById("comments-info");
    if (!body) return;
    const filters = [...document.querySelectorAll("[data-comment-filter]")]
      .map(input => [input.dataset.commentFilter, input.value.trim()])
      .filter(([, filter]) => filter);
    const rows = commentRows.filter(row => filters.every(([key, filter]) => matchesFilter(row, key, filter)));
    rows.sort((a,b) => {
      const left = valueFor(a, sortKey), right = valueFor(b, sortKey);
      const cmp = sortKey === "date"
        ? new Date(left).getTime() - new Date(right).getTime()
        : left.localeCompare(right, "fr", {numeric:true, sensitivity:"base"});
      return sortDirection === "asc" ? cmp : -cmp;
    });
    if (info) info.textContent = rows.length + " commentaire(s) affiché(s) sur " + commentRows.length;
    if (!rows.length) {
      body.innerHTML = '<tr><td colspan="4">Aucun commentaire ne correspond aux filtres.</td></tr>';
      return;
    }
    body.innerHTML = rows.map(row => '<tr><td style="white-space:nowrap">' + escapeHtml(dateLabel(row.date)) +
      '</td><td>' + escapeHtml(row.technician) + '</td><td>' + escapeHtml(row.utility) +
      '</td><td style="white-space:pre-wrap;min-width:240px">' + escapeHtml(row.comment) + '</td></tr>').join("");
  }
  async function loadComments() {
    const body = document.getElementById("comments-body");
    const info = document.getElementById("comments-info");
    if (!body || !window.db) return;
    body.innerHTML = '<tr><td colspan="4">⏳ Chargement...</td></tr>';
    const [measurements, maintenance] = await Promise.all([
      window.db.from("measurements").select("recorded_at,utility_name,data,technicians(first_name,last_name)").order("recorded_at", {ascending:false}).limit(1000),
      window.db.from("maintenance_logs").select("created_at,maintenance_date,utility_name,utility_label,comment,technician_name").order("created_at", {ascending:false}).limit(1000)
    ]);
    if (measurements.error || maintenance.error) {
      body.innerHTML = '<tr><td colspan="4">❌ Impossible de charger les commentaires. Vérifie les droits d’accès à la base.</td></tr>';
      if (info) info.textContent = "";
      return;
    }
    const rows = [];
    for (const record of measurements.data || []) {
      const data = record.data && typeof record.data === "object" ? record.data : {};
      for (const [key, raw] of Object.entries(data)) {
        if (!/comment|commentaire|observation/i.test(key) || raw == null || !String(raw).trim()) continue;
        rows.push({
          date:record.recorded_at,
          technician:[record.technicians?.first_name,record.technicians?.last_name].filter(Boolean).join(" ") || "—",
          utility:labels[record.utility_name] || record.utility_name || "—",
          comment:Array.isArray(raw) ? raw.join(", ") : String(raw).trim()
        });
      }
    }
    for (const record of maintenance.data || []) {
      if (record.comment && String(record.comment).trim()) rows.push({
        date:record.created_at || record.maintenance_date,
        technician:record.technician_name || "—",
        utility:record.utility_label || labels[record.utility_name] || record.utility_name || "—",
        comment:String(record.comment).trim()
      });
    }
    commentRows = rows;
    renderHeader();
    renderComments();
  }
  document.addEventListener("click", event => {
    const button = event.target.closest("[data-comment-sort]");
    if (!button) return;
    const key = button.dataset.commentSort;
    if (sortKey === key) sortDirection = sortDirection === "asc" ? "desc" : "asc";
    else { sortKey = key; sortDirection = key === "date" ? "desc" : "asc"; }
    renderHeader();
    renderComments();
  });
  document.addEventListener("input", event => {
    if (event.target.matches("[data-comment-filter]")) renderComments();
  });
  window.loadComments = loadComments;
})();