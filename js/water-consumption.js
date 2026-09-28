const WATER_METERS = {
    water: {
        label: "Traitement d'eau",
        meters: {
            cpt_R1: "Compteur R1",
            cpt_R2: "Compteur R2",
            cpt_general: "Compteur Général",
            cpt_vestiaires: "Compteur Vestiaires",
            cpt_process: "Compteur Process",
            cpt_adoucisseur: "Compteur Adoucisseur",
            cpt_lavemoule: "Compteur Lave-moule",
            cpt_bvm_tf: "Compteur BVM + TF",
            cpt_smt: "Compteur SMT"
        }
    },
    surchauffee: {
        label: "Chaudière eau surchauffée",
        meters: {
            cpt_osmosee: "Compteur Eau Osmosée",
            cpt_adoucie: "Compteur Eau Adoucie"
        }
    },
    vapeur: {
        label: "Chaudière vapeur",
        meters: {
            cpt_osmosee: "Compteur Eau Osmosée",
            cpt_adoucie: "Compteur Eau Adoucie"
        }
    }
};

let waterConsumptionRows = null;
let waterConsumptionRequest = null;

function waterDateKey(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

function waterFormatDate(date) {
    return new Date(date).toLocaleDateString("fr-FR");
}

function waterFormatValue(value) {
    return new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 2 }).format(value);
}

function getWaterMeterColumns() {
    return Object.entries(WATER_METERS).flatMap(([utilityId, utility]) =>
        Object.entries(utility.meters).map(([field, label]) => ({
            key: `${utilityId}:${field}`,
            label: label.replace(/^Compteur\s*/, ""),
            installation: utility.label
        }))
    );
}

function waterEscapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (character) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[character]);
}

async function fetchWaterConsumptionRows() {
    const utilities = Object.keys(WATER_METERS);
    const records = [];
    const batchSize = 1000;
    let offset = 0;

    while (true) {
        const { data, error } = await window.db
            .from("measurements")
            .select("recorded_at, utility_name, data")
            .in("utility_name", utilities)
            .order("recorded_at", { ascending: true })
            .range(offset, offset + batchSize - 1);

        if (error) throw error;
        records.push(...(data || []));
        if (!data || data.length < batchSize) break;
        offset += batchSize;
    }

    const metersByDay = new Map();
    for (const record of records) {
        const utility = WATER_METERS[record.utility_name];
        const recordedAt = new Date(record.recorded_at);
        if (!utility || Number.isNaN(recordedAt.getTime())) continue;

        for (const [field, label] of Object.entries(utility.meters)) {
            const rawValue = record.data && record.data[field];
            if (rawValue === undefined || rawValue === null || rawValue === "") continue;

            const value = Number(rawValue);
            if (!Number.isFinite(value)) continue;

            const meterKey = `${record.utility_name}:${field}`;
            const day = waterDateKey(recordedAt);
            const dayKey = `${meterKey}:${day}`;
            metersByDay.set(dayKey, {
                meterKey,
                day,
                date: recordedAt,
                installation: utility.label,
                meter: label,
                value
            });
        }
    }

    const meterSeries = new Map();
    for (const row of metersByDay.values()) {
        if (!meterSeries.has(row.meterKey)) meterSeries.set(row.meterKey, []);
        meterSeries.get(row.meterKey).push(row);
    }

    const rows = [];
    for (const series of meterSeries.values()) {
        series.sort((first, second) => first.date - second.date);
        let previous = null;

        for (const current of series) {
            rows.push({
                ...current,
                previousDate: previous ? previous.date : null,
                previousValue: previous ? previous.value : null,
                consumption: previous ? current.value - previous.value : null
            });
            previous = current;
        }
    }

    return rows.sort((first, second) => second.date - first.date
        || first.installation.localeCompare(second.installation, "fr")
        || first.meter.localeCompare(second.meter, "fr"));
}

function renderWaterConsumption() {
    const body = document.getElementById("water-consumption-body");
    const head = document.getElementById("water-consumption-head");
    const info = document.getElementById("water-consumption-info");
    if (!waterConsumptionRows) return;

    const columns = getWaterMeterColumns();
    head.innerHTML = `<tr><th>Date</th>${columns.map((column) =>
        `<th title="${column.label} - ${column.installation}">${column.label}<small>${column.installation}</small></th>`
    ).join("")}</tr>`;

    const from = document.getElementById("water-consumption-from").value;
    const to = document.getElementById("water-consumption-to").value;

    const rows = waterConsumptionRows.filter((row) => {
        const day = waterDateKey(row.date);
        return (!from || day >= from) && (!to || day <= to);
    });

    if (rows.length === 0) {
        body.innerHTML = `<tr><td colspan="${columns.length + 1}">Aucun relevé de compteur pour cette période.</td></tr>`;
        info.textContent = "Aucun relevé trouvé pour la période sélectionnée.";
        return;
    }

    const rowsByDay = new Map();
    for (const row of rows) {
        if (!rowsByDay.has(row.day)) rowsByDay.set(row.day, { date: row.date, meters: new Map() });
        rowsByDay.get(row.day).meters.set(row.meterKey, row);
    }

    const days = [...rowsByDay.entries()].sort(([first], [second]) => second.localeCompare(first));
    info.textContent = `${days.length} jour(s) affiché(s). Consommation dans l'unité du compteur.`;
    body.innerHTML = days.map(([day, readings]) => {
        const cells = columns.map((column) => {
            const reading = readings.meters.get(column.key);
            if (!reading) return "<td>—</td>";

            const indexes = reading.previousValue === null
                ? `Premier index : ${waterFormatValue(reading.value)}`
                : `${waterFormatValue(reading.previousValue)} → ${waterFormatValue(reading.value)}`;

            if (reading.consumption === null) {
                return `<td><span>—</span><small>${indexes}</small></td>`;
            }
            if (reading.consumption < 0) {
                return `<td><span class="water-consumption-alert">À vérifier</span><small>${indexes}</small></td>`;
            }
            return `<td><strong>${waterFormatValue(reading.consumption)}</strong><small>${indexes}</small></td>`;
        }).join("");

        return `<tr><td>${waterFormatDate(day)}</td>${cells}</tr>`;
    }).join("");
}

async function loadWaterConsumption() {
    const body = document.getElementById("water-consumption-body");
    const info = document.getElementById("water-consumption-info");
    if (!body || !window.db) return;

    if (waterConsumptionRows) {
        renderWaterConsumption();
        return;
    }

    body.innerHTML = `<tr><td colspan="${getWaterMeterColumns().length + 1}">Chargement des relevés...</td></tr>`;
    info.textContent = "Récupération des compteurs d'eau...";

    if (!waterConsumptionRequest) {
        waterConsumptionRequest = fetchWaterConsumptionRows();
    }

    try {
        waterConsumptionRows = await waterConsumptionRequest;
        renderWaterConsumption();
    } catch (error) {
        waterConsumptionRequest = null;
        body.innerHTML = `<tr><td colspan="${getWaterMeterColumns().length + 1}">Erreur : ${waterEscapeHtml(error.message || "chargement impossible")}</td></tr>`;
        info.textContent = "Impossible de charger les relevés.";
    }
}

document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("water-consumption-from")?.addEventListener("change", renderWaterConsumption);
    document.getElementById("water-consumption-to")?.addEventListener("change", renderWaterConsumption);
});