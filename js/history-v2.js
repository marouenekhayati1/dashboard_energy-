const HISTO_V2_LABELS = {
    water: "💧 Traitement d'eau",
    surchauffee: "🔥 Eau surchauffée",
    vapeur: "♨️ Chaudière vapeur",
    vide: "🔧 Pompe à vide",
    compresseurs: "💨 Compresseurs",
    glacee: "❄️ Eau glacée - Trane",
    chiller: "❄️ Eau glacée - Chiller",
    york: "❄️ Eau glacée - York",
    thermo: "🌡️ Thermoventilation",
    groupes: "⚡ Groupes électrogènes",
    osmose: "💧 Station d'osmose"
};

let historyV2Records = [];
let historyV2VisibleRecords = [];
let historyV2LastTrigger = null;
let historyV2SortKey = "recorded_at";
let historyV2SortDirection = "desc";

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

function flattenHistoryV2Rows(data) {
    const rows = [];

    for (const record of data || []) {
        if (record.utility_name !== "groupes" || !record.data || typeof record.data !== "object") {
            rows.push({ ...record, __historyGroupLabel: null });
            continue;
        }

        const groupRows = { 1: {}, 2: {} };
        for (const [key, value] of Object.entries(record.data)) {
            if (key === "_modifications") continue;
            const match = /^g([12])_(.+)$/.exec(key);
            if (match) {
                groupRows[match[1]][match[2]] = value;
            }
        }

        const groupIds = Object.keys(groupRows).filter((groupId) => Object.keys(groupRows[groupId]).length > 0);
        if (!groupIds.length) {
            rows.push({ ...record, __historyGroupLabel: "⚡ Groupes électrogènes" });
            continue;
        }

        for (const groupId of groupIds) {
            rows.push({
                ...record,
                data: {
                    ...groupRows[groupId],
                    ...(record.data._modifications ? { _modifications: record.data._modifications } : {})
                },
                __historyGroupLabel: `⚡ Groupe ${groupId}`
            });
        }
    }

    return rows;
}

function historyV2Technician(record) {
    return record.technicians
        ? `${record.technicians.first_name || ""} ${record.technicians.last_name || ""}`.trim()
        : "";
}

function historyV2Value(record, key) {
    if (key === "recorded_at") return record.recorded_at || "";
    if (key === "utility_name") return record.__historyGroupLabel || HISTO_V2_LABELS[record.utility_name] || record.utility_name || "";
    if (key === "__poste") return getPosteFromDate(new Date(record.recorded_at)) || "";
    if (key === "__technician") return historyV2Technician(record);
    if (key === "__audit") return (record.data?._modifications || []).map((item) => `${item.first_name || ""} ${item.last_name || ""} ${item.edited_at || ""}`).join(" ");
    if (key === "__detailcount") return Object.keys(record.data || {}).filter((field) => field !== "_modifications").length;
    return "";
}

function historyV2DateKey(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function updateHistoryV2Technicians() {
    const select = document.getElementById("history-v2-technician-filter");
    if (!select) return;
    const selected = select.value;
    const names = [...new Set(historyV2Records.map(historyV2Technician).filter(Boolean))].sort((left, right) => left.localeCompare(right, "fr"));
    select.innerHTML = '<option value="">Tous les techniciens</option>' + names.map((name) => `<option value="${escapeHistoryV2(name)}">${escapeHistoryV2(name)}</option>`).join("");
    if (names.includes(selected)) select.value = selected;
}

function renderHistoryV2Header() {
    const header = document.querySelector("#history-v2-zone thead tr");
    if (!header) return;
    const columns = [
        ["__audit", "Modifié par / le"],
        ["recorded_at", "Date et heure"],
        ["utility_name", "Check-list"],
        ["__poste", "Poste"],
        ["__technician", "Technicien"],
        ["__detailcount", "Détail"]
    ];
    header.innerHTML = columns.map(([key, label]) => {
        const indicator = historyV2SortKey === key ? (historyV2SortDirection === "asc" ? " ▲" : " ▼") : "";
        return `<th><button class="history-sort" type="button" data-history-v2-sort="${key}">${label}${indicator}</button></th>`;
    }).join("") + "<th>Action</th>";
}

function renderHistoryV2Table() {
    const body = document.getElementById("history-v2-body");
    const info = document.getElementById("history-v2-info");
    if (!body) return;

    const dateFrom = document.getElementById("history-v2-date-from")?.value || "";
    const dateTo = document.getElementById("history-v2-date-to")?.value || "";
    const posteFilter = document.getElementById("history-v2-poste-filter")?.value || "";
    const technicianFilter = document.getElementById("history-v2-technician-filter")?.value || "";

    historyV2VisibleRecords = historyV2Records.filter((record) => {
        const timestamp = new Date(record.recorded_at);
        const dateKey = Number.isNaN(timestamp.getTime()) ? "" : historyV2DateKey(timestamp);
        if (dateFrom && dateKey < dateFrom) return false;
        if (dateTo && dateKey > dateTo) return false;
        if (posteFilter && historyV2Value(record, "__poste") !== posteFilter) return false;
        if (technicianFilter && historyV2Value(record, "__technician") !== technicianFilter) return false;
        return true;
    });

    historyV2VisibleRecords.sort((left, right) => {
        const leftValue = historyV2Value(left, historyV2SortKey);
        const rightValue = historyV2Value(right, historyV2SortKey);
        const comparison = historyV2SortKey === "recorded_at"
            ? new Date(leftValue).getTime() - new Date(rightValue).getTime()
            : typeof leftValue === "number" && typeof rightValue === "number"
                ? leftValue - rightValue
                : String(leftValue).localeCompare(String(rightValue), "fr", { numeric: true, sensitivity: "base" });
        return historyV2SortDirection === "asc" ? comparison : -comparison;
    });

    info.textContent = `${historyV2VisibleRecords.length} relevé(s) affiché(s) sur ${historyV2Records.length}`;
    if (!historyV2VisibleRecords.length) {
        body.innerHTML = '<tr><td colspan="7">Aucun relevé ne correspond aux filtres.</td></tr>';
        return;
    }

    body.innerHTML = historyV2VisibleRecords.map((record, index) => {
        const technician = historyV2Technician(record) || "—";
        const timestamp = new Date(record.recorded_at);
        const date = Number.isNaN(timestamp.getTime()) ? "Date inconnue" : timestamp.toLocaleString("fr-FR");
        const poste = getPosteFromDate(timestamp) || "—";
        const label = historyV2Value(record, "utility_name");
        const fieldCount = historyV2Value(record, "__detailcount");
        const session = getSession();
        const canEdit = session?.role === "admin" || session?.id === record.technician_id;
        return `<tr>
            <td>${renderModificationAudit(record.data)}</td>
            <td style="white-space:nowrap">${escapeHistoryV2(date)}</td>
            <td style="white-space:nowrap">${escapeHistoryV2(label)}</td>
            <td>${escapeHistoryV2(poste)}</td>
            <td style="white-space:nowrap">${escapeHistoryV2(technician)}</td>
            <td><button class="btn btn-secondary" type="button" data-history-v2-detail="${index}" style="padding:6px 12px;font-size:12px">👁️ Voir (${fieldCount})</button></td>
            <td>${canEdit ? `<button class="btn btn-success" type="button" data-history-v2-edit="${index}" style="padding:6px 12px;font-size:12px">Modifier</button>` : "—"}</td>
        </tr>`;
    }).join("");
}

async function loadHistoryV2() {
    const body = document.getElementById("history-v2-body");
    const info = document.getElementById("history-v2-info");
    if (!body || !window.db) return;

    body.innerHTML = '<tr><td colspan="7">⏳ Chargement...</td></tr>';
    const filter = document.getElementById("history-v2-filter").value;
    const limitValue = document.getElementById("history-v2-nb").value;

    let query = window.db.from("measurements")
        .select("*, technicians(first_name, last_name)")
        .order("recorded_at", { ascending: false });

    if (limitValue !== "all") query = query.limit(parseInt(limitValue, 10) || 50);
    if (filter) query = query.eq("utility_name", filter);

    const { data, error } = await query;
    if (error) {
        body.innerHTML = `<tr><td colspan="7">❌ Erreur : ${escapeHistoryV2(error.message)}</td></tr>`;
        info.textContent = "Impossible de charger l'historique.";
        return;
    }

    const flattenedRecords = flattenHistoryV2Rows(data || []);
    historyV2Records = flattenedRecords;
    if (historyV2Records.length === 0) {
        body.innerHTML = '<tr><td colspan="7">Aucun relevé trouvé.</td></tr>';
        info.textContent = "";
        return;
    }

    updateHistoryV2Technicians();
    renderHistoryV2Header();
    renderHistoryV2Table();
}

function viewHistoryV2Detail(index, trigger) {
    const record = historyV2VisibleRecords[index];
    if (!record) return;

    historyV2LastTrigger = trigger;
    const detailBody = document.getElementById("history-v2-detail-body");
    const modal = document.getElementById("history-v2-detail-modal");
    const fields = record.data && typeof record.data === "object"
        ? Object.entries(record.data).filter(([key]) => key !== "_modifications")
        : [];

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
            const record = historyV2VisibleRecords[Number(editButton.dataset.historyV2Edit)];
            if (record) editChecklistRecord(record.id);
        }
    });

    document.querySelector("#history-v2-zone thead")?.addEventListener("click", (event) => {
        const button = event.target.closest("[data-history-v2-sort]");
        if (!button) return;
        if (historyV2SortKey === button.dataset.historyV2Sort) {
            historyV2SortDirection = historyV2SortDirection === "asc" ? "desc" : "asc";
        } else {
            historyV2SortKey = button.dataset.historyV2Sort;
            historyV2SortDirection = "asc";
        }
        renderHistoryV2Header();
        renderHistoryV2Table();
    });

    document.getElementById("history-v2-filter")?.addEventListener("change", loadHistoryV2);
    document.getElementById("history-v2-nb")?.addEventListener("change", loadHistoryV2);
    ["history-v2-date-from", "history-v2-date-to", "history-v2-poste-filter", "history-v2-technician-filter"]
        .forEach((id) => document.getElementById(id)?.addEventListener("change", renderHistoryV2Table));
    document.querySelector("[data-action='close-history-v2-detail']")?.addEventListener("click", closeHistoryV2Detail);

    const modal = document.getElementById("history-v2-detail-modal");
    modal?.addEventListener("click", (event) => {
        if (event.target === modal) closeHistoryV2Detail();
    });
    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && modal?.classList.contains("show")) closeHistoryV2Detail();
    });
});