const HISTO_V2_LABELS = {
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

let historyV2Records = [];
let historyV2LastTrigger = null;

function escapeHistoryV2(value) {
    return String(value).replace(/[&<>"']/g, (character) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[character]);
}

function historyV2FieldLabel(id) {
    for (const checklist of Object.values(CHECKLISTS)) {
        for (const section of checklist.sections) {
            const field = section.fields.find((candidate) => candidate.id === id);
            if (field) return field.label;
        }
    }
    return id;
}

async function loadHistoryV2() {
    const body = document.getElementById("history-v2-body");
    const info = document.getElementById("history-v2-info");
    if (!body || !window.db) return;

    body.innerHTML = '<tr><td colspan="6">⏳ Chargement...</td></tr>';
    const filter = document.getElementById("history-v2-filter").value;
    const limitValue = document.getElementById("history-v2-nb").value;

    let query = window.db.from("measurements")
        .select("*, technicians(first_name, last_name)")
        .order("recorded_at", { ascending: false });

    if (limitValue !== "all") query = query.limit(parseInt(limitValue, 10) || 50);
    if (filter) query = query.eq("utility_name", filter);

    const { data, error } = await query;
    if (error) {
        body.innerHTML = `<tr><td colspan="6">❌ Erreur : ${escapeHistoryV2(error.message)}</td></tr>`;
        info.textContent = "Impossible de charger l'historique.";
        return;
    }

    historyV2Records = data || [];
    if (historyV2Records.length === 0) {
        body.innerHTML = '<tr><td colspan="6">Aucun relevé trouvé.</td></tr>';
        info.textContent = "";
        return;
    }

    info.textContent = `${historyV2Records.length} relevé(s) affiché(s)`;
    body.innerHTML = historyV2Records.map((record, index) => {
        const technician = record.technicians
            ? `${record.technicians.first_name || ""} ${record.technicians.last_name || ""}`.trim()
            : "—";
        const timestamp = new Date(record.recorded_at);
        const date = Number.isNaN(timestamp.getTime()) ? "Date inconnue" : timestamp.toLocaleString("fr-FR");
        const label = HISTO_V2_LABELS[record.utility_name] || record.utility_name || "—";
        const fieldCount = record.data ? Object.keys(record.data).length : 0;

        const canEdit = getSession()?.id === record.technician_id;
        return `<tr>
            <td style="white-space:nowrap">${escapeHistoryV2(date)}</td>
            <td style="white-space:nowrap">${escapeHistoryV2(label)}</td>
            <td>${escapeHistoryV2(record.poste || "—")}</td>
            <td style="white-space:nowrap">${escapeHistoryV2(technician || "—")}</td>
            <td><button class="btn btn-secondary" type="button" data-history-v2-detail="${index}" style="padding:6px 12px;font-size:12px">👁️ Voir (${fieldCount})</button></td>
            <td>${canEdit ? `<button class="btn btn-secondary" type="button" data-history-v2-edit="${index}" style="padding:6px 12px;font-size:12px">Modifier</button>` : "—"}</td>
        </tr>`;
    }).join("");
}

function viewHistoryV2Detail(index, trigger) {
    const record = historyV2Records[index];
    if (!record) return;

    historyV2LastTrigger = trigger;
    const detailBody = document.getElementById("history-v2-detail-body");
    const modal = document.getElementById("history-v2-detail-modal");
    const fields = record.data && typeof record.data === "object" ? Object.entries(record.data) : [];

    detailBody.innerHTML = fields.length
        ? fields.map(([key, value]) => {
            const displayValue = value === null || value === ""
                ? "—"
                : typeof value === "object" ? JSON.stringify(value) : String(value);
            return `<tr><td><strong>${escapeHistoryV2(historyV2FieldLabel(key))}</strong></td><td>${escapeHistoryV2(displayValue)}</td></tr>`;
        }).join("")
        : '<tr><td colspan="2">Aucun champ enregistré.</td></tr>';

    modal.classList.add("show");
    modal.focus();
}

function closeHistoryV2Detail() {
    document.getElementById("history-v2-detail-modal").classList.remove("show");
    if (historyV2LastTrigger) historyV2LastTrigger.focus();
}

document.addEventListener("DOMContentLoaded", () => {
    const body = document.getElementById("history-v2-body");
    body?.addEventListener("click", (event) => {
        const button = event.target.closest("[data-history-v2-detail]");
        if (button) viewHistoryV2Detail(Number(button.dataset.historyV2Detail), button);
        const editButton = event.target.closest("[data-history-v2-edit]");
        if (editButton) {
            const record = historyV2Records[Number(editButton.dataset.historyV2Edit)];
            if (record) editChecklistRecord(record.id);
        }
    });

    document.getElementById("history-v2-filter")?.addEventListener("change", loadHistoryV2);
    document.getElementById("history-v2-nb")?.addEventListener("change", loadHistoryV2);
    document.querySelector("[data-action='close-history-v2-detail']")?.addEventListener("click", closeHistoryV2Detail);

    const modal = document.getElementById("history-v2-detail-modal");
    modal?.addEventListener("click", (event) => {
        if (event.target === modal) closeHistoryV2Detail();
    });
    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && modal?.classList.contains("show")) closeHistoryV2Detail();
    });
});