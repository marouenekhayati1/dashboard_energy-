/* ============================================
   HISTORIQUE DES RELEVÉS — tableau détaillé complet
   ============================================ */

const HISTO_LABELS = {
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

function renderModificationAudit(data) {
    const modifications = Array.isArray(data?._modifications) ? data._modifications : [];
    if (!modifications.length) return "—";

    return modifications.map((modification) => {
        const name = [modification.first_name, modification.last_name].filter(Boolean).join(" ") || "Nom inconnu";
        const timestamp = new Date(modification.edited_at);
        const date = Number.isNaN(timestamp.getTime()) ? "Date inconnue" : timestamp.toLocaleString("fr-FR");
        return `<div>${escapeHistoryHtml(name)}<br><small>${escapeHistoryHtml(date)}</small></div>`;
    }).join("");
}

function flattenHistoryRows(data) {
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
            const cloned = {
                ...record,
                data: {
                    ...groupRows[groupId],
                    ...(record.data._modifications ? { _modifications: record.data._modifications } : {})
                },
                __historyGroupLabel: `⚡ Groupe ${groupId}`
            };
            rows.push(cloned);
        }
    }

    return rows;
}

function escapeHistoryHtml(value) {
    return String(value).replace(/[&<>"']/g, (character) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[character]);
}

let historyRows = [];
let historyColumns = [];
let historySortKey = "recorded_at";
let historySortDirection = "desc";

function historyTechnician(record) {
    return record.technicians
        ? `${record.technicians.first_name || ""} ${record.technicians.last_name || ""}`.trim()
        : "";
}

function historyValue(record, key) {
    if (key === "recorded_at") return record.recorded_at || "";
    if (key === "utility_name") return record.__historyGroupLabel || HISTO_LABELS[record.utility_name] || record.utility_name || "";
    if (key === "__poste") return getPosteFromDate(new Date(record.recorded_at)) || "";
    if (key === "__technician") return historyTechnician(record);
    if (key === "__audit") return (record.data?._modifications || []).map((item) => `${item.first_name || ""} ${item.last_name || ""} ${item.edited_at || ""}`).join(" ");
    if (key === "__action") return "";
    const value = record.data?.[key];
    return value === null || value === undefined ? "" : typeof value === "object" ? JSON.stringify(value) : String(value);
}

function historyFilterValue(record, key) {
    if (key !== "recorded_at") return historyValue(record, key);
    const timestamp = new Date(record.recorded_at);
    return Number.isNaN(timestamp.getTime()) ? historyValue(record, key) : timestamp.toLocaleString("fr-FR");
}

function matchesHistoryColumnFilter(record, key, filter) {
    const comparison = /^\s*(>=|<=|>|<|=)\s*(-?\d+(?:[.,]\d+)?)\s*$/.exec(filter);
    if (comparison) {
        const rawValue = historyValue(record, key).trim();
        if (!rawValue) return false;
        const value = Number(rawValue.replace(",", "."));
        const target = Number(comparison[2].replace(",", "."));
        if (!Number.isFinite(value)) return false;

        switch (comparison[1]) {
            case ">": return value > target;
            case "<": return value < target;
            case ">=": return value >= target;
            case "<=": return value <= target;
            default: return value === target;
        }
    }

    return historyFilterValue(record, key).toLocaleLowerCase("fr-FR").includes(filter.toLocaleLowerCase("fr-FR"));
}

function historyDateKey(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function renderHistoryTable() {
    const tbody = document.getElementById("history-body");
    const info = document.getElementById("history-info");
    if (!tbody) return;

    const dateFrom = document.getElementById("history-date-from")?.value || "";
    const dateTo = document.getElementById("history-date-to")?.value || "";
    const columnFilters = [...document.querySelectorAll("[data-history-column-filter]")]
        .map((input) => [input.dataset.historyColumnFilter, input.value.trim().toLocaleLowerCase("fr-FR")])
        .filter(([, value]) => value);

    const visibleRows = historyRows.filter((record) => {
        const timestamp = new Date(record.recorded_at);
        const dateKey = Number.isNaN(timestamp.getTime()) ? "" : historyDateKey(timestamp);
        if (dateFrom && dateKey < dateFrom) return false;
        if (dateTo && dateKey > dateTo) return false;
        return columnFilters.every(([key, value]) => matchesHistoryColumnFilter(record, key, value));
    });

    visibleRows.sort((left, right) => {
        const leftValue = historyValue(left, historySortKey);
        const rightValue = historyValue(right, historySortKey);
        const comparison = historySortKey === "recorded_at"
            ? new Date(leftValue).getTime() - new Date(rightValue).getTime()
            : leftValue.localeCompare(rightValue, "fr", { numeric: true, sensitivity: "base" });
        return historySortDirection === "asc" ? comparison : -comparison;
    });

    info.textContent = `${visibleRows.length} ligne(s) affichée(s) sur ${historyRows.length}`;
    if (!visibleRows.length) {
        tbody.innerHTML = `<tr><td colspan="${6 + historyColumns.length}">Aucun relevé ne correspond aux filtres.</td></tr>`;
        return;
    }

    tbody.innerHTML = visibleRows.map((record) => {
        const session = getSession();
        const canEdit = session?.role === "admin" || session?.id === record.technician_id;
        const technician = historyTechnician(record) || "—";
        const recordedAt = new Date(record.recorded_at);
        const date = Number.isNaN(recordedAt.getTime()) ? "Date inconnue" : recordedAt.toLocaleString("fr-FR");
        const poste = getPosteFromDate(recordedAt) || "—";
        const label = record.__historyGroupLabel || HISTO_LABELS[record.utility_name] || record.utility_name;

        let html = `<tr>
            <td>${renderModificationAudit(record.data)}</td>
            <td style="white-space:nowrap">${escapeHistoryHtml(date)}</td>
            <td style="white-space:nowrap">${escapeHistoryHtml(label)}</td>
            <td>${escapeHistoryHtml(poste)}</td>
            <td style="white-space:nowrap">${escapeHistoryHtml(technician)}</td>
            <td>${canEdit
                ? `<button class="btn btn-success" type="button" data-edit-measurement="${encodeURIComponent(record.id)}">Modifier</button>`
                : "—"}</td>`;

        for (const column of historyColumns) {
            const value = historyValue(record, column) || "—";
            html += `<td>${escapeHistoryHtml(value)}</td>`;
        }
        return html + "</tr>";
    }).join("");
}

function historySortHeader(key, label) {
    const indicator = historySortKey === key ? (historySortDirection === "asc" ? " ▲" : " ▼") : "";
    return `<th><button class="history-sort" type="button" data-history-sort="${escapeHistoryHtml(key)}">${escapeHistoryHtml(label)}${indicator}</button></th>`;
}

function renderHistoryHeader() {
    const thead = document.getElementById("history-thead");
    const filterValues = new Map([...thead.querySelectorAll("[data-history-column-filter]")]
        .map((input) => [input.dataset.historyColumnFilter, input.value]));
    const sortable = [
        ["__audit", "Modifié par / le"],
        ["recorded_at", "Date et heure"],
        ["utility_name", "Check-list"],
        ["__poste", "Poste"],
        ["__technician", "Technicien"]
    ];
    let header = `<tr>${sortable.map(([key, label]) => historySortHeader(key, label)).join("")}<th>Action</th>`;
    header += historyColumns.map((column) => {
        const label = historyRows.some((record) => record.utility_name === "groupes" && record.data?.[column] !== undefined)
            ? getLabel(`g1_${column}`)
            : getLabel(column);
        return historySortHeader(column, label);
    }).join("") + "</tr>";

    const filterKeys = ["__audit", "recorded_at", "utility_name", "__poste", "__technician", "__action", ...historyColumns];
    header += `<tr>${filterKeys.map((key) => key === "__action"
        ? "<th></th>"
        : `<th><input class="history-column-filter" type="search" data-history-column-filter="${escapeHistoryHtml(key)}" aria-label="Filtrer ${escapeHistoryHtml(key)}" placeholder="Filtrer" value="${escapeHistoryHtml(filterValues.get(key) || "")}"></th>`).join("")}</tr>`;
    thead.innerHTML = header;
}

async function loadHistory() {
    const thead = document.getElementById("history-thead");
    const tbody = document.getElementById("history-body");
    const info = document.getElementById("history-info");

    tbody.innerHTML = '<tr><td colspan="6">⏳ Chargement...</td></tr>';

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
        tbody.innerHTML = '<tr><td colspan="6">❌ Erreur : ' + error.message + '</td></tr>';
        return;
    }

    if (!data || data.length === 0) {
        historyRows = [];
        thead.innerHTML = "";
        tbody.innerHTML = '<tr><td colspan="6">Aucun relevé trouvé.</td></tr>';
        info.textContent = "";
        return;
    }

    historyRows = flattenHistoryRows(data);
    historyColumns = [];
    for (const r of historyRows) {
        if (!r.data) continue;
        for (const key in r.data) {
            if (key !== "_modifications" && !historyColumns.includes(key)) historyColumns.push(key);
        }
    }
    renderHistoryHeader();
    renderHistoryTable();
}

document.addEventListener("DOMContentLoaded", () => {
    const body = document.getElementById("history-body");
    body?.addEventListener("click", (event) => {
        const button = event.target.closest("[data-edit-measurement]");
        if (button) editChecklistRecord(decodeURIComponent(button.dataset.editMeasurement));
    });

    document.getElementById("history-thead")?.addEventListener("click", (event) => {
        const button = event.target.closest("[data-history-sort]");
        if (!button) return;
        if (historySortKey === button.dataset.historySort) {
            historySortDirection = historySortDirection === "asc" ? "desc" : "asc";
        } else {
            historySortKey = button.dataset.historySort;
            historySortDirection = "asc";
        }
        renderHistoryHeader();
        renderHistoryTable();
    });

    document.getElementById("history-thead")?.addEventListener("input", renderHistoryTable);
    ["history-date-from", "history-date-to"]
        .forEach((id) => document.getElementById(id)?.addEventListener("change", renderHistoryTable));
    ["history-filter", "history-nb"].forEach((id) => document.getElementById(id)?.addEventListener("change", loadHistory));
});
