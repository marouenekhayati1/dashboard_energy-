/* ============================================
   HISTORIQUE DES RELEVÉS
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


async function loadHistory() {
    const tbody = document.getElementById("history-body");
    const info = document.getElementById("history-info");
    tbody.innerHTML = '<tr><td colspan="5">⏳ Chargement...</td></tr>';

    const filtre = document.getElementById("history-filter").value;
    const nb = parseInt(document.getElementById("history-nb").value) || 50;

    let query = db.from("measurements")
        .select("*, technicians(first_name, last_name)")
        .order("recorded_at", { ascending: false })
        .limit(nb);

    if (filtre) query = query.eq("utility_name", filtre);

    const { data, error } = await query;

    if (error) {
        tbody.innerHTML = '<tr><td colspan="5">❌ Erreur : ' + error.message + '</td></tr>';
        return;
    }

    if (!data || data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5">Aucun relevé trouvé.</td></tr>';
        info.textContent = "";
        return;
    }

    info.textContent = data.length + " relevé(s) affiché(s)";

    let html = "";
    for (const r of data) {
        const tech = r.technicians
            ? r.technicians.first_name + " " + r.technicians.last_name
            : "—";
        const date = new Date(r.recorded_at).toLocaleString("fr-FR");
        const label = HISTO_LABELS[r.utility_name] || r.utility_name;
        const nbChamps = r.data ? Object.keys(r.data).length : 0;

        html += '<tr>'
              + '<td>' + date + '</td>'
              + '<td>' + label + '</td>'
              + '<td>' + (r.poste || "—") + '</td>'
              + '<td>' + tech + '</td>'
              + '<td><button class="btn btn-secondary" style="padding:6px 12px;font-size:12px" onclick=\'viewDetail('
              + JSON.stringify(JSON.stringify(r.data)).replace(/'/g, "&#39;")
              + ')\'>👁️ Voir (' + nbChamps + ')</button></td>'
              + '</tr>';
    }
    tbody.innerHTML = html;
}


function viewDetail(dataJson) {
    const data = JSON.parse(dataJson);
    let html = "";
    for (const key in data) {
        html += '<tr><td><strong>' + key + '</strong></td><td>' + data[key] + '</td></tr>';
    }
    document.getElementById("detail-body").innerHTML = html;
    document.getElementById("detail-modal").classList.add("show");
}


function closeDetail() {
    document.getElementById("detail-modal").classList.remove("show");
}
