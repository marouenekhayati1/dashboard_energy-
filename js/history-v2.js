let historyV2Records = [];
let historyV2VisibleRecords = [];
let historyV2LastTrigger = null;
let historyV2SortKey = "recorded_at";
let historyV2SortDirection = "desc";

function historyV2Value(record, key) {
    if (key === "recorded_at") return record.recorded_at || "";
    if (key === "utility_name") return record.__historyGroupLabel || HISTO_LABELS[record.utility_name] || record.utility_name || "";
    if (key === "__poste") return getPosteFromDate(new Date(record.recorded_at)) || "";
    if (key === "__technician") return historyTechnician(record);
    if (key === "__audit") return (record.data?._modifications || []).map((item) => `${item.first_name || ""} ${item.last_name || ""} ${item.edited_at || ""}`).join(" ");
    if (key === "__detailcount") return Object.keys(record.data || {}).filter((field) => field !== "_modifications").length;
    return "";
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

    historyV2VisibleRecords = historyV2Records.filter((record) => {
        const timestamp = new Date(record.recorded_at);
        const dateKey = Number.isNaN(timestamp.getTime()) ? "" : historyDateKey(timestamp);
        if (dateFrom && dateKey < dateFrom) return false;
        if (dateTo && dateKey > dateTo) return false;
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
        const technician = historyTechnician(record) || "—";
        const timestamp = new Date(record.recorded_at);
        const date = Number.isNaN(timestamp.getTime()) ? "Date inconnue" : timestamp.toLocaleString("fr-FR");
        const poste = getPosteFromDate(timestamp) || "—";
        const label = historyV2Value(record, "utility_name");
        const fieldCount = historyV2Value(record, "__detailcount");
        const session = getSession();
        const canEdit = session?.role === "admin" || session?.id === record.technician_id;
        return `<tr>
            <td>${renderModificationAudit(record.data)}</td>
            <td style="white-space:nowrap">${escapeHistoryHtml(date)}</td>
            <td style="white-space:nowrap">${escapeHistoryHtml(label)}</td>
            <td>${escapeHistoryHtml(poste)}</td>
            <td style="white-space:nowrap">${escapeHistoryHtml(technician)}</td>
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
        body.innerHTML = `<tr><td colspan="7">❌ Erreur : ${escapeHistoryHtml(error.message)}</td></tr>`;
        info.textContent = "Impossible de charger l'historique.";
        return;
    }

    const flattenedRecords = flattenHistoryRows(data || []);
    historyV2Records = flattenedRecords;
    if (historyV2Records.length === 0) {
        body.innerHTML = '<tr><td colspan="7">Aucun relevé trouvé.</td></tr>';
        info.textContent = "";
        return;
    }

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
            return `<tr><td><strong>${escapeHistoryHtml(getLabel(key))}</strong></td><td>${escapeHistoryHtml(displayValue)}</td></tr>`;
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
    ["history-v2-date-from", "history-v2-date-to"]
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