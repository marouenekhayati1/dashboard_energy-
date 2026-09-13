/* ============================================
   MOTEUR DE CHECK-LISTS
   ============================================ */

const CHECKLISTS = {}; // registre rempli par js/checklists.js

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
    document.getElementById("dashboard").style.display = "block";

    const zone = document.getElementById("checklist-zone");
    zone.style.display = "none";
    zone.innerHTML =
        '<div class="page-header"><h1 id="checklist-title"></h1></div>';

    // Mettre à jour le menu actif
    document.querySelectorAll(".menu-item").forEach(mi => mi.classList.remove("active"));
    const first = document.querySelector(".sidebar .menu-item");
    if (first) first.classList.add("active");
}


/* ---------- OUVRIR UNE CHECK-LIST ---------- */

function openChecklist(id) {
    const cfg = CHECKLISTS[id];
    if (!cfg) { alert("Check-list introuvable : " + id); return; }

    document.getElementById("dashboard").style.display = "none";

    const zone = document.getElementById("checklist-zone");
    zone.style.display = "block";

    document.getElementById("checklist-title").textContent = cfg.icon + " " + cfg.title;

    let html = "";
    for (const section of cfg.sections) {
        const hidden = section.night && currentPoste() !== "nuit" ? " hidden" : "";
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
        <button class="btn btn-secondary" onclick="showDashboard()">Annuler</button>
        <button class="btn btn-success" onclick="saveChecklist('${id}')">💾 Enregistrer</button>
    </div>`;

    zone.innerHTML = html;

    // Mettre à jour le menu actif (surligner l'item cliqué)
    document.querySelectorAll(".menu-item").forEach(mi => mi.classList.remove("active"));
    document.querySelectorAll(".sidebar .menu-item").forEach(mi => {
        const oc = mi.getAttribute("onclick");
        if (oc && oc.includes("'" + id + "'")) {
            mi.classList.add("active");
        }
    });

    // Remonter en haut de la page
    window.scrollTo(0, 0);
}


/* ---------- RENDU D'UN CHAMP ---------- */

function renderField(f) {

    // Info de plage (min/max) ou indication
    let info = "";
    if (f.min !== undefined && f.max !== undefined) {
        info = '<div class="range-info">Min : ' + f.min + ' / Max : ' + f.max + (f.unit || "") + '</div>';
    } else if (f.hint) {
        info = '<div class="range-info">' + f.hint + '</div>';
    }

    // Zone de statut (🟢/🔴) si min/max définis
    const statusDiv = (f.min !== undefined && f.max !== undefined)
        ? '<div id="status_' + f.id + '" class="status"></div>'
        : "";

    let input = "";

    if (f.type === "number") {
        const oninput = (f.min !== undefined && f.max !== undefined)
            ? ' oninput="checkRange(\'' + f.id + '\',' + f.min + ',' + f.max + ',\'status_' + f.id + '\')"'
            : "";
        input = '<input type="number" step="any" id="' + f.id + '"' + oninput + '>';
    }
    else if (f.type === "text") {
        input = '<input type="text" id="' + f.id + '">';
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
        input = '<textarea rows="4" id="' + f.id + '" placeholder="Commentaire..."></textarea>';
    }

    return '<div class="form-group"><label>' + f.label + '</label>' + input + info + statusDiv + '</div>';
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
    const values = {};

    for (const section of cfg.sections) {
        for (const f of section.fields) {
            const el = document.getElementById(f.id);
            if (!el) continue;

            if (f.type === "radio") {
                const checked = document.querySelector('input[name="' + f.id + '"]:checked');
                if (checked) values[f.id] = checked.value;
            }
            else if (f.type === "checkbox") {
                values[f.id] = el.checked ? f.label2 : "";
            }
            else if (el.value !== "") {
                values[f.id] = el.value;
            }
        }
    }

    const { error } = await db.from("measurements").insert({
        technician_id: session.id,
        utility_id: null,
        value: 0,
        data: values,
        poste: currentPoste(),
        utility_name: id,
        recorded_at: new Date().toISOString()
    });

    if (error) {
        alert("Erreur : " + error.message);
        return;
    }

    alert("✅ Check-list enregistrée avec succès !");
}
