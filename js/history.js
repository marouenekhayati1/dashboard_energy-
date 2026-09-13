/* ============================================
   HISTORIQUE DES RELEVÉS — tableau détaillé complet
   ============================================ */

const HISTO_LABELS = {
    water: "💧 Traitement d'eau",
    surchauffee: "🔥 Eau surchauffée",
    vapeur: "♨️ Chaudière vapeur",
    vide: "🔧 Pompe à vide",
    compresseurs: "💨 Compresseurs",
    glacee: "❄️ Eau glacée",
    thermo: "🌡️ Thermoventilation",
    groupes: "⚡ Groupes électrogènes",
    osmose: "💧 Station d'osmose"
};

// Libellés humains des champs (récupérés depuis les check-lists enregistrées)
function getLabel(id) {
    for (const cid in CHECKLISTS) {
        for (const section of CHECKLISTS[cid].sections) {
            const f = section.fields.find(f => f.id === id);
            if (f) return f.label;
        }
    }
    return id; // champ inconnu → on affiche l'id brut
}


async function loadHistory() {
    const thead = document.getElementById("history-thead");
    const tbody = document.getElementById("history-body");
    const info = document.getElementById("history-info");

    tbody.innerHTML = '<tr><td colspan="4">⏳ Chargement...</td></tr>';

    const filtre = document.getElementById("history-filter").value;
    const nb = parseInt(document.getElementById("history-nb").value) || 50;

    let query = db.from("measurements")
        .select("*, technicians(first_name, last_name)")
        .order("recorded_at", { ascending: false })
        .limit(nb);

    if (filtre) query = query.eq("utility_name", filtre);

    const { data, error } = await query;

    if (error) {
        tbody.innerHTML = '<tr><td colspan="4">❌ Erreur : ' + error.message + '</td></tr>';
        return;
    }

    if (!data || data.length === 0) {
        thead.innerHTML = "";
        tbody.innerHTML = '<tr><td colspan="4">Aucun relevé trouvé.</td></tr>';
        info.textContent = "";
        return;
    }

    info.textContent = data.length + " relevé(s) affiché(s)";

    // 1. Construire la liste ordonnée de tous les champs rencontrés (sans doublons)
    const columns = [];
    for (const r of data) {
        if (!r.data) continue;
        for (const key in r.data) {
            if (!columns.includes(key)) columns.push(key);
        }
    }

    // 2. En-tête : colonnes fixes + colonnes de détails
    let th = '<th>Date et heure</th>'
           + '<th>Check-list</th>'
           + '<th>Poste</th>'
           + '<th>Technicien</th>';
    for (const col of columns) {
        th += '<th>' + getLabel(col) + '</th>';
    }
    thead.innerHTML = th;

    // 3. Lignes : valeurs directement affichées
    let html = "";
    for (const r of data) {
        const tech = r.technicians
            ? r.technicians.first_name + " " + r.technicians.last_name
            : "—";
        const date = new Date(r.recorded_at).toLocaleString("fr-FR");
        const label = HISTO_LABELS[r.utility_name] || r.utility_name;

        html += '<tr>'
              + '<td style="white-space:nowrap">' + date + '</td>'
              + '<td style="white-space:nowrap">' + label + '</td>'
              + '<td>' + (r.poste || "—") + '</td>'
              + '<td style="white-space:nowrap">' + tech + '</td>';

        for (const col of columns) {
            const val = (r.data && r.data[col] !== undefined && r.data[col] !== "") ? r.data[col] : "—";
            html += '<td>' + val + '</td>';
        }
        html += '</tr>';
    }
    tbody.innerHTML = html;
}
