/* ============================================
   HISTORIQUE DES RELEVÉS — tableau détaillé complet
   ============================================ */

const HISTO_LABELS = {
    water: "💧 Traitement d'eau",
    surchauffee: "🔥 Eau surchauffée",
    vapeur: "♨️ Chaudière vapeur",
    vide: "🔧 Pompe à vide",
    compresseurs: "💨 Compresseurs",
    glacee: "❄️ Eau glacée - Trane et Chiller",
    york: "❄️ Eau glacée - York",
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
    const nbValue = document.getElementById("history-nb").value;
    const nb = nbValue === "all" ? null : parseInt(nbValue, 10) || 50;

    let query = db.from("measurements")
        .select("*, technicians(first_name, last_name)")
        .order("recorded_at", { ascending: false });

    if (nb !== null) query = query.limit(nb);
    if (filtre) query = query.eq("utility_name", filtre);

    const { data, error } = await query;

    if (error) {
        tbody.innerHTML = '<tr><td colspan="5">❌ Erreur : ' + error.message + '</td></tr>';
        return;
    }

    if (!data || data.length === 0) {
        thead.innerHTML = "";
        tbody.innerHTML = '<tr><td colspan="5">Aucun relevé trouvé.</td></tr>';
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
            + '<th>Technicien</th>'
            + '<th>Action</th>';
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
              + '<td style="white-space:nowrap">' + tech + '</td>'
              + '<td>' + (getSession()?.id === r.technician_id
                  ? '<button class="btn btn-secondary" type="button" data-edit-measurement="' + encodeURIComponent(r.id) + '">Modifier</button>'
                  : '—') + '</td>';

        for (const col of columns) {
            const val = (r.data && r.data[col] !== undefined && r.data[col] !== "") ? r.data[col] : "—";
            html += '<td>' + val + '</td>';
        }
        html += '</tr>';
    }
    tbody.innerHTML = html;
}

document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("history-body")?.addEventListener("click", (event) => {
        const button = event.target.closest("[data-edit-measurement]");
        if (button) editChecklistRecord(decodeURIComponent(button.dataset.editMeasurement));
    });
});
