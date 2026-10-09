(() => {
  const labels = {
    water:"Traitement d'eau", surchauffee:"Eau surchauffée", vapeur:"Chaudière vapeur",
    vide:"Pompe à vide", compresseurs:"Compresseurs", glacee:"Eau glacée - Trane",
    chiller:"Eau glacée - Chiller", york:"Eau glacée - York", thermo:"Thermoventilation",
    groupes:"Groupes électrogènes", osmose:"Station d'osmose"
  };
  const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, c => ({
    "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;"
  })[c]);
  const dateLabel = (value) => {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString("fr-FR");
  };
  async function loadComments() {
    const body = document.getElementById("comments-body");
    const info = document.getElementById("comments-info");
    if (!body || !window.db) return;
    body.innerHTML = '<tr><td colspan="4">⏳ Chargement...</td></tr>';
    const [measurements, maintenance] = await Promise.all([
      window.db.from("measurements")
        .select("recorded_at,utility_name,data,technicians(first_name,last_name)")
        .order("recorded_at", { ascending: false }).limit(1000),
      window.db.from("maintenance_logs")
        .select("created_at,maintenance_date,utility_name,utility_label,comment,technician_name")
        .order("created_at", { ascending: false }).limit(1000)
    ]);
    if (measurements.error || maintenance.error) {
      body.innerHTML = '<tr><td colspan="4">❌ Impossible de charger tous les commentaires. Vérifie les droits d’accès à la base.</td></tr>';
      if (info) info.textContent = "";
      return;
    }
    const rows = [];
    for (const record of measurements.data || []) {
      const data = record.data && typeof record.data === "object" ? record.data : {};
      const comments = Object.entries(data)
        .filter(([key, value]) => /comment|commentaire|observation/i.test(key) && value != null && String(value).trim())
        .map(([, value]) => Array.isArray(value) ? value.join(", ") : String(value).trim());
      for (const comment of comments) rows.push({
        date: record.recorded_at,
        technician: [record.technicians?.first_name, record.technicians?.last_name].filter(Boolean).join(" ") || "—",
        utility: labels[record.utility_name] || record.utility_name || "—",
        comment
      });
    }
    for (const record of maintenance.data || []) {
      if (record.comment && String(record.comment).trim()) rows.push({
        date: record.created_at || record.maintenance_date,
        technician: record.technician_name || "—",
        utility: record.utility_label || labels[record.utility_name] || record.utility_name || "—",
        comment: String(record.comment).trim()
      });
    }
    rows.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    if (info) info.textContent = rows.length + " commentaire(s) non vide(s)";
    if (!rows.length) {
      body.innerHTML = '<tr><td colspan="4">Aucun commentaire enregistré.</td></tr>';
      return;
    }
    body.innerHTML = rows.map(row => '<tr><td style="white-space:nowrap">' + escapeHtml(dateLabel(row.date)) +
      '</td><td>' + escapeHtml(row.technician) + '</td><td>' + escapeHtml(row.utility) +
      '</td><td style="white-space:pre-wrap;min-width:240px">' + escapeHtml(row.comment) + '</td></tr>').join("");
  }
  window.loadComments = loadComments;
})();