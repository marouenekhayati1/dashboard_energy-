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
    const info = document.getElementById("water-consumption-info");
    if (!waterConsumptionRows) return;

    const from = document.getElementById("water-consumption-from").value;
    const to = document.getElementById("water-consumption-to").value;

    const rows = waterConsumptionRows.filter((row) => {
        const day = waterDateKey(row.date);
        return (!from || day >= from) && (!to || day <= to);
    });

    if (rows.length === 0) {
        body.innerHTML = '<tr><td colspan="7">Aucun relevé de compteur pour cette période.</td></tr>';
        info.textContent = "Aucun relevé trouvé pour la période sélectionnée.";
        return;
    }

    info.textContent = `${rows.length} relevé(s) affiché(s). Consommation dans l'unité du compteur.`;
    body.innerHTML = rows.map((row) => {
        const isReset = row.consumption !== null && row.consumption < 0;
        let consumption = "— (premier relevé)";
        if (row.consumption !== null) {
            consumption = isReset
                ? '<span class="water-consumption-alert">À vérifier : index inférieur</span>'
                : waterFormatValue(row.consumption);
        }

        return `<tr>
            <td>${waterFormatDate(row.date)}</td>
            <td>${row.installation}</td>
            <td>${row.meter}</td>
            <td>${row.previousDate ? waterFormatDate(row.previousDate) : "—"}</td>
            <td>${row.previousValue === null ? "—" : waterFormatValue(row.previousValue)}</td>
            <td>${waterFormatValue(row.value)}</td>
            <td>${consumption}</td>
        </tr>`;
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

    body.innerHTML = '<tr><td colspan="7">Chargement des relevés...</td></tr>';
    info.textContent = "Récupération des compteurs d'eau...";

    if (!waterConsumptionRequest) {
        waterConsumptionRequest = fetchWaterConsumptionRows();
    }

    try {
        waterConsumptionRows = await waterConsumptionRequest;
        renderWaterConsumption();
    } catch (error) {
        waterConsumptionRequest = null;
        body.innerHTML = `<tr><td colspan="7">Erreur : ${waterEscapeHtml(error.message || "chargement impossible")}</td></tr>`;
        info.textContent = "Impossible de charger les relevés.";
    }
}

document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("water-consumption-from")?.addEventListener("change", renderWaterConsumption);
    document.getElementById("water-consumption-to")?.addEventListener("change", renderWaterConsumption);
});