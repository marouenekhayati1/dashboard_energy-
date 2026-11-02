/* Consommation des compteurs de la chaudière eau surchauffée.
   Un relevé est attendu à chaque poste (matin, après-midi, nuit). */
let surchauffeeConsumptionRows = null;
let surchauffeeConsumptionRequest = null;

function surchauffeeDateKey(value) {
    const date = new Date(value);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function surchauffeeFormatNumber(value) {
    return new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 2 }).format(value);
}

function surchauffeeFormatDate(value) {
    return new Date(value + "T12:00:00").toLocaleDateString("fr-FR");
}

function surchauffeeEscape(value) {
    return String(value).replace(/[&<>"']/g, (character) => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    })[character]);
}

async function fetchSurchauffeeConsumption() {
    const records = [];
    const batchSize = 1000;
    let offset = 0;

    while (true) {
        const { data, error } = await window.db.from("measurements")
            .select("recorded_at, poste, data")
            .eq("utility_name", "surchauffee")
            .order("recorded_at", { ascending: true })
            .range(offset, offset + batchSize - 1);

        if (error) throw error;
        records.push(...(data || []));
        if (!data || data.length < batchSize) break;
        offset += batchSize;
    }

    const meters = [
        { key: "cpt_osmosee", label: "Eau osmosée" },
        { key: "cpt_adoucie", label: "Eau adoucie" }
    ];
    const rows = [];

    for (const meter of meters) {
        let previous = null;
        for (const record of records) {
            const raw = record.data && record.data[meter.key];
            if (raw === undefined || raw === null || raw === "") continue;
            const value = Number(raw);
            const timestamp = new Date(record.recorded_at);
            if (!Number.isFinite(value) || Number.isNaN(timestamp.getTime())) continue;

            const consumption = previous === null ? null : value - previous.value;
            rows.push({
                date: surchauffeeDateKey(timestamp),
                timestamp,
                poste: record.poste || "non-renseigne",
                meter: meter.key,
                label: meter.label,
                value,
                previousValue: previous ? previous.value : null,
                consumption
            });
            previous = { value, timestamp };
        }
    }

    const grouped = new Map();
    for (const row of rows) {
        const key = `${row.date}:${row.poste}`;
        if (!grouped.has(key)) grouped.set(key, { date: row.date, poste: row.poste, osmosee: null, adoucie: null });
        grouped.get(key)[row.meter === "cpt_osmosee" ? "osmosee" : "adoucie"] = row;
    }
    return [...grouped.values()].sort((a, b) =>
        b.date.localeCompare(a.date) || ["matin", "apres-midi", "nuit"].indexOf(a.poste) - ["matin", "apres-midi", "nuit"].indexOf(b.poste)
    );
}

function renderSurchauffeeConsumption() {
    const body = document.getElementById("surchauffee-consumption-body");
    const head = document.getElementById("surchauffee-consumption-head");
    const info = document.getElementById("surchauffee-consumption-info");
    if (!body || !head || !surchauffeeConsumptionRows) return;

    head.innerHTML = "<tr><th>Date</th><th>Poste</th><th>Eau osmosée (m³)</th><th>Index osmosée</th><th>Eau adoucie (m³)</th><th>Index adoucie</th></tr>";
    const from = document.getElementById("surchauffee-consumption-from")?.value || "";
    const to = document.getElementById("surchauffee-consumption-to")?.value || "";
    const rows = surchauffeeConsumptionRows.filter(row => (!from || row.date >= from) && (!to || row.date <= to));

    if (!rows.length) {
        body.innerHTML = '<tr><td colspan="6">Aucun relevé pour cette période.</td></tr>';
        info.textContent = "Aucun relevé trouvé pour la période sélectionnée.";
        return;
    }

    const posteLabels = { matin: "Matin", "apres-midi": "Après-midi", nuit: "Nuit", "non-renseigne": "Non renseigné" };
    const dayTotals = new Map();
    for (const row of rows) {
        if (!dayTotals.has(row.date)) dayTotals.set(row.date, { osmosee: 0, adoucie: 0 });
        if (row.osmosee?.consumption >= 0) dayTotals.get(row.date).osmosee += row.osmosee.consumption;
        if (row.adoucie?.consumption >= 0) dayTotals.get(row.date).adoucie += row.adoucie.consumption;
    }

    let previousDate = null;
    const htmlRows = [];
    for (const row of rows) {
        const cell = reading => {
            if (!reading) return "—";
            const index = reading.previousValue === null
                ? `Premier index : ${surchauffeeFormatNumber(reading.value)}`
                : `${surchauffeeFormatNumber(reading.previousValue)} → ${surchauffeeFormatNumber(reading.value)}`;
            if (reading.consumption === null) return `<span>—</span><small>${index}</small>`;
            if (reading.consumption < 0) return `<span class="water-consumption-alert">À vérifier</span><small>${index}</small>`;
            return `<strong>${surchauffeeFormatNumber(reading.consumption)}</strong><small>${index}</small>`;
        };
        htmlRows.push(`<tr><td>${previousDate === row.date ? "" : surchauffeeFormatDate(row.date)}</td><td>${posteLabels[row.poste] || surchauffeeEscape(row.poste)}</td><td>${cell(row.osmosee)}</td><td>${row.osmosee ? surchauffeeFormatNumber(row.osmosee.value) : "—"}</td><td>${cell(row.adoucie)}</td><td>${row.adoucie ? surchauffeeFormatNumber(row.adoucie.value) : "—"}</td></tr>`);
        previousDate = row.date;
        const next = rows[rows.indexOf(row) + 1];
        if (!next || next.date !== row.date) {
            const totals = dayTotals.get(row.date);
            htmlRows.push(`<tr class="water-consumption-total"><th colspan="2">Total journée</th><th>${surchauffeeFormatNumber(totals.osmosee)}</th><th>—</th><th>${surchauffeeFormatNumber(totals.adoucie)}</th><th>—</th></tr>`);
        }
    }
    body.innerHTML = htmlRows.join("");
    info.textContent = `${rows.length} relevé(s) de poste affiché(s). Les consommations sont calculées entre deux index successifs.`;
}

async function loadSurchauffeeConsumption(forceRefresh = false) {
    const body = document.getElementById("surchauffee-consumption-body");
    const info = document.getElementById("surchauffee-consumption-info");
    if (!body || !window.db) return;
    if (forceRefresh) {
        surchauffeeConsumptionRows = null;
        surchauffeeConsumptionRequest = null;
    }
    if (surchauffeeConsumptionRows) {
        renderSurchauffeeConsumption();
        return;
    }
    body.innerHTML = '<tr><td colspan="6">Chargement des relevés...</td></tr>';
    info.textContent = "Récupération des index eau osmosée et eau adoucie...";
    if (!surchauffeeConsumptionRequest) surchauffeeConsumptionRequest = fetchSurchauffeeConsumption();
    try {
        surchauffeeConsumptionRows = await surchauffeeConsumptionRequest;
        renderSurchauffeeConsumption();
    } catch (error) {
        surchauffeeConsumptionRequest = null;
        body.innerHTML = `<tr><td colspan="6">Erreur : ${surchauffeeEscape(error.message || "chargement impossible")}</td></tr>`;
        info.textContent = "Impossible de charger les relevés.";
    }
}

document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("surchauffee-consumption-from")?.addEventListener("change", renderSurchauffeeConsumption);
    document.getElementById("surchauffee-consumption-to")?.addEventListener("change", renderSurchauffeeConsumption);
});
