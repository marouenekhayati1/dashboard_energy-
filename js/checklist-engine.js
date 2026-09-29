/* ============================================
   MOTEUR DE CHECK-LISTS
   ============================================ */

const CHECKLISTS = {}; // registre rempli par js/checklists.js
let activeChecklist = null;

function registerChecklist(id, config) {
    CHECKLISTS[id] = config;
}


/* ---------- POSTE ACTUEL ---------- */

function currentPoste() {
    const h = new Date().getHours();
    if (h >= 6 && h < 14) return "matin";
    if (h >= 14 && h < 22) return "apres-midi";
    return "nuit";
}


/* ---------- AFFICHER LE DASHBOARD ---------- */

function showDashboard() {
    if (!canLeaveChecklist()) return;
    activeChecklist = null;
    rememberDashboardView("dashboard");

    document.getElementById("dashboard").style.display = "block";

    const zone = document.getElementById("checklist-zone");
    zone.style.display = "none";
   
   const hz = document.getElementById("history-zone");
    if (hz) hz.style.display = "none";
    const historyV2Zone = document.getElementById("history-v2-zone");
    if (historyV2Zone) historyV2Zone.style.display = "none";
    const waterConsumptionZone = document.getElementById("water-consumption-zone");
    if (waterConsumptionZone) waterConsumptionZone.style.display = "none";

    zone.innerHTML = "";

    document.querySelectorAll(".menu-item").forEach(mi => mi.classList.remove("active"));
    const first = document.querySelector(".sidebar .menu-item");
    if (first) first.classList.add("active");
}

function cancelChecklist() {
    activeChecklist = null;
    showDashboard();
}

function rememberDashboardView(view) {
    sessionStorage.setItem("dashboard-view", view);
}


/* ---------- OUVRIR UNE CHECK-LIST ----------
   Navigation libre : appelée à chaque clic dans la sidebar,
   même si une autre check-list est déjà ouverte.
   Le formulaire est toujours reconstruit à neuf. ---------- */

async function openChecklist(id, record = null) {
    const cfg = CHECKLISTS[id];
    if (!cfg) { alert("Check-list introuvable : " + id); return; }
    if (!canLeaveChecklist()) return;

    const poste = record ? record.poste : currentPoste();
    if (!record) {
        const interval = getPosteInterval(poste);
        const { data, error } = await db.from("measurements")
            .select("id")
            .eq("utility_name", id)
            .eq("poste", poste)
            .gte("recorded_at", interval.start.toISOString())
            .lt("recorded_at", interval.end.toISOString())
            .limit(1);

        if (error) {
            alert("Impossible de vérifier cette check-list : " + error.message);
            return;
        }
        if (data && data.length) {
            alert("Cette check-list a déjà été remplie pour le poste " + poste + ". Elle sera disponible au prochain poste.");
            return;
        }
    }

    // Masquer le dashboard, afficher la zone check-list
    document.getElementById("dashboard").style.display = "none";

    const zone = document.getElementById("checklist-zone");
    zone.style.display = "block";
    const hz = document.getElementById("history-zone");
    if (hz) hz.style.display = "none";
    const historyV2Zone = document.getElementById("history-v2-zone");
    if (historyV2Zone) historyV2Zone.style.display = "none";
    const waterConsumptionZone = document.getElementById("water-consumption-zone");
    if (waterConsumptionZone) waterConsumptionZone.style.display = "none";

    // Construire TOUT le contenu, y compris le titre (écrase l'ancien)
    let html = '<div class="page-header"><h1>' + cfg.icon + " " + cfg.title + '</h1></div>';

    for (const section of cfg.sections) {
        const hidden = section.night && poste !== "nuit" ? " hidden" : "";
        html += '<div class="section' + (section.night ? " night-only" : "") + hidden + '">';
        html += '<div class="section-header">' + section.title + '</div>';
        html += '<div class="section-body"><div class="form-grid">';

        for (const field of section.fields) {
            html += renderField(field);
        }
        html += '</div></div></div>';
    }

    html += `
    <div class="actions">
        <button class="btn btn-secondary" onclick="cancelChecklist()">Annuler</button>
        <button class="btn btn-success" onclick="saveChecklist('${id}')">💾 ${record ? "Enregistrer les modifications" : "Enregistrer"}</button>
    </div>`;

    zone.innerHTML = html;
    activeChecklist = {
        id,
        recordId: record ? record.id : null,
        poste,
        data: record && record.data && typeof record.data === "object" ? record.data : {}
    };
    rememberDashboardView("dashboard");

    for (const section of cfg.sections) {
        for (const field of section.fields) {
            const value = activeChecklist.data[field.id];
            if (value === undefined) continue;
            if (field.type === "radio") {
                const option = Array.from(document.querySelectorAll('input[name="' + field.id + '"]'))
                    .find((input) => input.value === String(value));
                if (option) option.checked = true;
            } else if (field.type === "checkbox") {
                const input = document.getElementById(field.id);
                if (input) input.checked = value === field.label2;
            } else {
                const input = document.getElementById(field.id);
                if (input) input.value = value;
            }
            if (field.min !== undefined && field.max !== undefined && value !== "") {
                checkRange(field.id, field.min, field.max, "status_" + field.id);
            }
        }
    }
    attachChecklistValidation();

    // Surligner l'item du menu cliqué
    document.querySelectorAll(".menu-item").forEach(mi => mi.classList.remove("active"));
    document.querySelectorAll(".sidebar .menu-item").forEach(mi => {
        const oc = mi.getAttribute("onclick");
        if (oc && oc.includes("'" + id + "'")) {
            mi.classList.add("active");
        }
    });

    window.scrollTo(0, 0);
    return true;
}

function getPosteInterval(poste) {
    const now = new Date();
    const start = new Date(now);
    const startHour = poste === "matin" ? 6 : poste === "apres-midi" ? 14 : 22;
    start.setHours(startHour, 0, 0, 0);

    if (poste === "nuit" && now.getHours() < 6) {
        start.setDate(start.getDate() - 1);
    } else if (poste !== "nuit" && now.getHours() < startHour) {
        start.setDate(start.getDate() - 1);
    }

    const end = new Date(start);
    end.setHours(end.getHours() + 8);
    return { start, end };
}

function isChecklistFieldRequired(field) {
    return field.required !== false && field.id !== "commentaire" && field.id !== "dosage_info";
}

function checklistMissingFields() {
    if (!activeChecklist) return [];
    const cfg = CHECKLISTS[activeChecklist.id];
    const missing = [];

    for (const section of cfg.sections) {
        if (section.night && activeChecklist.poste !== "nuit") continue;
        for (const field of section.fields) {
            if (!isChecklistFieldRequired(field)) continue;
            let hasValue = false;
            if (field.type === "radio") {
                hasValue = Boolean(document.querySelector('input[name="' + field.id + '"]:checked'));
            } else if (field.type === "checkbox") {
                hasValue = Boolean(document.getElementById(field.id)?.checked);
            } else {
                hasValue = Boolean(document.getElementById(field.id)?.value.trim());
            }
            if (!hasValue) missing.push(field);
        }
    }
    return missing;
}

function showChecklistErrors(missing) {
    document.querySelectorAll("#checklist-zone .field-error").forEach((message) => {
        message.hidden = true;
    });
    document.querySelectorAll("#checklist-zone [aria-invalid='true']").forEach((input) => {
        input.removeAttribute("aria-invalid");
    });

    for (const field of missing) {
        const message = document.getElementById("error_" + field.id);
        if (message) message.hidden = false;

        const inputs = field.type === "radio"
            ? document.querySelectorAll('input[name="' + field.id + '"]')
            : [document.getElementById(field.id)];
        inputs.forEach((input) => input?.setAttribute("aria-invalid", "true"));
    }
}

function attachChecklistValidation() {
    const cfg = CHECKLISTS[activeChecklist.id];
    for (const section of cfg.sections) {
        if (section.night && activeChecklist.poste !== "nuit") continue;
        for (const field of section.fields) {
            if (!isChecklistFieldRequired(field)) continue;
            const inputs = field.type === "radio"
                ? document.querySelectorAll('input[name="' + field.id + '"]')
                : [document.getElementById(field.id)];
            inputs.forEach((input) => {
                if (!input) return;
                input.setAttribute("aria-describedby", "error_" + field.id);
                const clearError = () => {
                    if (!checklistMissingFields().some((missing) => missing.id === field.id)) {
                        const message = document.getElementById("error_" + field.id);
                        if (message) message.hidden = true;
                        inputs.forEach((fieldInput) => fieldInput?.removeAttribute("aria-invalid"));
                    }
                };
                input.addEventListener("input", clearError);
                input.addEventListener("change", clearError);
            });
        }
    }
}

function canLeaveChecklist() {
    const missing = checklistMissingFields();
    if (!missing.length) return true;

    showChecklistErrors(missing);
    alert("Veuillez compléter tous les champs obligatoires avant de quitter cette check-list. Champ manquant : " + missing[0].label);
    const field = missing[0];
    const input = field.type === "radio"
        ? document.querySelector('input[name="' + field.id + '"]')
        : document.getElementById(field.id);
    input?.scrollIntoView({ behavior: "smooth", block: "center" });
    input?.focus();
    return false;
}

async function editChecklistRecord(recordId) {
    const session = getSession();
    if (!session) {
        alert("Session technicien introuvable.");
        return;
    }

    const { data, error } = await db.from("measurements")
        .select("*")
        .eq("id", recordId)
        .eq("technician_id", session.id)
        .maybeSingle();

    if (error || !data) {
        alert(error ? "Erreur : " + error.message : "Vous pouvez uniquement modifier vos propres saisies.");
        return;
    }
    await openChecklist(data.utility_name, data);
}

window.addEventListener("beforeunload", (event) => {
    if (checklistMissingFields().length) {
        event.preventDefault();
        event.returnValue = "";
    }
});


/* ---------- RENDU D'UN CHAMP ---------- */

function renderField(f) {

    let info = "";
    if (f.min !== undefined && f.max !== undefined) {
        info = '<div class="range-info">Min : ' + f.min + ' / Max : ' + f.max + (f.unit || "") + '</div>';
    } else if (f.hint) {
        info = '<div class="range-info">' + f.hint + '</div>';
    }

    const statusDiv = (f.min !== undefined && f.max !== undefined)
        ? '<div id="status_' + f.id + '" class="status"></div>'
        : "";
    const readonly = f.id === "dosage_info" ? " readonly" : "";
    const error = isChecklistFieldRequired(f)
        ? '<div class="field-error" id="error_' + f.id + '" hidden>Ce champ est obligatoire pour enregistrer.</div>'
        : "";

    let input = "";

    if (f.type === "number") {
        const oninput = (f.min !== undefined && f.max !== undefined)
            ? ' oninput="checkRange(\'' + f.id + '\',' + f.min + ',' + f.max + ',\'status_' + f.id + '\')"'
            : "";
        input = '<input type="number" step="any" id="' + f.id + '"' + oninput + readonly + '>';
    }
    else if (f.type === "text") {
        input = '<input type="text" id="' + f.id + '"' + readonly + '>';
    }
    else if (f.type === "select") {
        input = '<select id="' + f.id + '"><option value="">Sélectionner</option>';
        for (const opt of f.options) {
            input += '<option>' + opt + '</option>';
        }
        input += '</select>';
    }
    else if (f.type === "radio") {
        input = '<div class="radio-group">';
        f.options.forEach((opt, i) => {
            const oid = f.id + "_" + i;
            input += '<div class="radio-option">'
                  + '<input type="radio" name="' + f.id + '" id="' + oid + '" value="' + opt + '">'
                  + '<label for="' + oid + '">' + opt + '</label>'
                  + '</div>';
        });
        input += '</div>';
    }
    else if (f.type === "checkbox") {
        input = '<div class="radio-group"><div class="radio-option">'
              + '<input type="checkbox" id="' + f.id + '">'
              + '<label for="' + f.id + '">' + f.label2 + '</label>'
              + '</div></div>';
    }
    else if (f.type === "textarea") {
        input = '<textarea rows="4" id="' + f.id + '" placeholder="Commentaire..."' + readonly + '></textarea>';
    }

    return '<div class="form-group"><label>' + f.label + '</label>' + input + error + info + statusDiv + '</div>';
}


/* ---------- CONTRÔLE MIN / MAX ---------- */

function checkRange(id, min, max, statusId) {
    const value = parseFloat(document.getElementById(id).value);
    const status = document.getElementById(statusId);

    if (isNaN(value)) {
        status.innerHTML = "";
        return;
    }

    if (value >= min && value <= max) {
        status.innerHTML = "🟢 Conforme";
        status.className = "status ok";
    } else {
        status.innerHTML = "🔴 Hors limite";
        status.className = "status error";
    }
}


/* ---------- ENREGISTREMENT VERS SUPABASE ---------- */

async function saveChecklist(id) {
    const cfg = CHECKLISTS[id];
    if (!activeChecklist || activeChecklist.id !== id) return;

    const missing = checklistMissingFields();
    if (missing.length) {
        canLeaveChecklist();
        return;
    }

    const values = { ...activeChecklist.data };

    for (const section of cfg.sections) {
        if (section.night && activeChecklist.poste !== "nuit") continue;
        for (const f of section.fields) {
            const el = document.getElementById(f.id);
            if (!el) {
                if (activeChecklist.data[f.id] !== undefined) values[f.id] = activeChecklist.data[f.id];
                continue;
            }

            if (f.type === "radio") {
                const checked = document.querySelector('input[name="' + f.id + '"]:checked');
                values[f.id] = checked ? checked.value : "";
            }
            else if (f.type === "checkbox") {
                values[f.id] = el.checked ? f.label2 : "";
            }
            else values[f.id] = el.value;
        }
    }

    const session = getSession();
    let result;
    if (activeChecklist.recordId) {
        result = await db.from("measurements").update({ data: values })
            .eq("id", activeChecklist.recordId)
            .eq("technician_id", session.id)
            .select("id")
            .maybeSingle();
        if (!result.error && !result.data) {
            alert("Vous pouvez uniquement modifier vos propres saisies.");
            return;
        }
    } else {
        const interval = getPosteInterval(activeChecklist.poste);
        const { data: existing, error: checkError } = await db.from("measurements")
            .select("id")
            .eq("utility_name", id)
            .eq("poste", activeChecklist.poste)
            .gte("recorded_at", interval.start.toISOString())
            .lt("recorded_at", interval.end.toISOString())
            .limit(1);
        if (checkError) {
            alert("Impossible de vérifier cette check-list : " + checkError.message);
            return;
        }
        if (existing && existing.length) {
            alert("Cette check-list a déjà été remplie pour ce poste.");
            showDashboard();
            return;
        }

        result = await db.from("measurements").insert({
            technician_id: session.id,
            value: 0,
            data: values,
            poste: activeChecklist.poste,
            utility_name: id,
            recorded_at: new Date().toISOString()
        });
    }

    if (result.error) {
        alert("Erreur : " + result.error.message);
        return;
    }

    alert(activeChecklist.recordId ? "✅ Modifications enregistrées avec succès !" : "✅ Check-list enregistrée avec succès !");
    activeChecklist = null;
    showDashboard();
}
