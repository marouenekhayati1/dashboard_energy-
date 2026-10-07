document.addEventListener("DOMContentLoaded", () => {
  if (window.initTheme) {
    window.initTheme();
  }

  if (!window.supabase) {
    return;
  }

  const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  window.db = db;

  const session = getSession();
  if (!session) {
    window.location.href = "index.html";
    return;
  }

  const userName = session.first_name + " " + session.last_name;
  const userInfo = document.querySelector(".user-info span");
  if (userInfo) {
    userInfo.textContent = "👤 " + userName;
  }

  const technicienField = document.getElementById("technicien");
  if (technicienField) {
    technicienField.value = userName;
  }

  function assignActionHandlers() {
    document.querySelectorAll("[data-action]").forEach((element) => {
      const action = element.dataset.action;

      element.onclick = null;

      if (action === "logout") {
        element.addEventListener("click", (event) => {
          if (!canLeaveChecklist()) {
            event.preventDefault();
            return;
          }
          logout();
        });
      }

      if (action === "show-dashboard") {
        element.addEventListener("click", showDashboard);
      }

      if (action === "open-history") {
        element.addEventListener("click", openHistory);
      }

      if (action === "open-history-v2") {
        element.addEventListener("click", openHistoryV2);
      }

      if (action === "open-maintenance") {
        element.addEventListener("click", openMaintenance);
      }

      if (action === "open-water-consumption") {
        element.addEventListener("click", openWaterConsumption);
      }

      if (action === "open-anomalies") {
        element.addEventListener("click", openAnomalies);
      }

      if (action === "save-anomalie") {
        element.addEventListener("click", saveAnomalie);
      }
    });

    document.querySelectorAll("[data-action='open-checklist']").forEach((element) => {
      element.addEventListener("click", () => {
        const id = element.dataset.id;
        if (id) openChecklist(id);
      });
    });

    const historyFilter = document.getElementById("history-filter");
    if (historyFilter) {
      historyFilter.onchange = () => loadHistory();
    }

    const historyNb = document.getElementById("history-nb");
    if (historyNb) {
      historyNb.onchange = () => loadHistory();
    }

    const anoFilter = document.getElementById("ano-filter");
    if (anoFilter) {
      anoFilter.onchange = () => loadAnomalies();
    }
  }

  function getPosteLabel(poste) {
    if (poste === "matin") return "Matin";
    if (poste === "apres-midi") return "Après-midi";
    if (poste === "nuit") return "Nuit";
    return "—";
  }

  function updateDateTime() {
    const now = new Date();
    const dateField = document.getElementById("date");
    if (dateField) {
      dateField.value = now.toLocaleDateString("fr-FR") + " " + now.toLocaleTimeString("fr-FR");
    }

    const poste = currentPoste();
    if (lastObservedPoste !== null && poste !== lastObservedPoste) {
      refreshDashboardChecklistStatuses();
    }
    lastObservedPoste = poste;
    const posteField = document.getElementById("poste");
    if (posteField) {
      posteField.value = getPosteLabel(poste);
    }

    const badge = document.getElementById("badge-poste");
    if (badge) {
      badge.textContent = "Poste : " + getPosteLabel(poste);
    }

    document.querySelectorAll(".night-only").forEach((el) => {
      if (poste === "nuit") el.classList.remove("hidden");
      else el.classList.add("hidden");
    });
  }

  function mobileGo(dest) {
    if (!dest) return;
    if (dest === "home") showDashboard();
    else if (dest === "history") openHistory();
    else if (dest === "history-v2") openHistoryV2();
    else if (dest === "maintenance") openMaintenance();
    else if (dest === "water-consumption") openWaterConsumption();
    else if (dest === "anomalies") openAnomalies();
    else openChecklist(dest);

    const mobileNav = document.getElementById("mobile-nav");
    if (mobileNav) {
      mobileNav.value = "";
    }
  }

  function hideAllZones() {
    if (!canLeaveChecklist()) return false;
    if (typeof closeHistoryV2Detail === "function") closeHistoryV2Detail();

    const dashboard = document.getElementById("dashboard");
    const checklistZone = document.getElementById("checklist-zone");
    const historyZone = document.getElementById("history-zone");
    const historyV2Zone = document.getElementById("history-v2-zone");
    const maintenanceZone = document.getElementById("maintenance-zone");
    const waterConsumptionZone = document.getElementById("water-consumption-zone");
    const anomaliesZone = document.getElementById("anomalies-zone");

    if (dashboard) dashboard.style.display = "none";
    if (checklistZone) checklistZone.style.display = "none";
    if (historyZone) historyZone.style.display = "none";
    if (historyV2Zone) historyV2Zone.style.display = "none";
    if (maintenanceZone) maintenanceZone.style.display = "none";
    if (waterConsumptionZone) waterConsumptionZone.style.display = "none";
    if (anomaliesZone) anomaliesZone.style.display = "none";
    return true;
  }

  function openHistory() {
    if (!hideAllZones()) return;
    rememberDashboardView("history");
    const historyZone = document.getElementById("history-zone");
    if (historyZone) historyZone.style.display = "block";

    document.querySelectorAll(".menu-item").forEach((mi) => mi.classList.remove("active"));
    document.querySelectorAll(".sidebar .menu-item").forEach((mi) => {
      const onclick = mi.getAttribute("onclick");
      if (onclick && onclick.includes("openHistory")) mi.classList.add("active");
    });

    if (typeof loadHistory === "function") {
      loadHistory();
    }
    window.scrollTo(0, 0);
  }

  function openHistoryV2() {
    if (!hideAllZones()) return;
    rememberDashboardView("history-v2");
    const zone = document.getElementById("history-v2-zone");
    if (zone) zone.style.display = "block";

    document.querySelectorAll(".menu-item").forEach((item) => item.classList.remove("active"));
    const menuItem = document.querySelector("[data-action='open-history-v2']");
    if (menuItem) menuItem.classList.add("active");

    if (typeof loadHistoryV2 === "function") {
      loadHistoryV2();
    }
    window.scrollTo(0, 0);
  }

  function openMaintenance() {
    if (!hideAllZones()) return;
    rememberDashboardView("maintenance");
    const zone = document.getElementById("maintenance-zone");
    if (zone) zone.style.display = "block";

    document.querySelectorAll(".menu-item").forEach((item) => item.classList.remove("active"));
    const menuItem = document.querySelector("[data-action='open-maintenance']");
    if (menuItem) menuItem.classList.add("active");

    if (typeof window.loadMaintenance === "function") {
      window.loadMaintenance();
    }
    window.scrollTo(0, 0);
  }

  function openWaterConsumption() {
    if (!hideAllZones()) return;
    rememberDashboardView("water-consumption");
    const zone = document.getElementById("water-consumption-zone");
    if (zone) zone.style.display = "block";

    document.querySelectorAll(".menu-item").forEach((item) => item.classList.remove("active"));
    const menuItem = document.querySelector("[data-action='open-water-consumption']");
    if (menuItem) menuItem.classList.add("active");

    if (typeof loadWaterConsumption === "function") {
      loadWaterConsumption(true);
    }
    window.scrollTo(0, 0);
  }

  const ANO_LABELS = {
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

  function openAnomalies() {
    if (!hideAllZones()) return;
    rememberDashboardView("anomalies");
    const anomaliesZone = document.getElementById("anomalies-zone");
    if (anomaliesZone) anomaliesZone.style.display = "block";

    document.querySelectorAll(".menu-item").forEach((mi) => mi.classList.remove("active"));
    document.querySelectorAll(".sidebar .menu-item").forEach((mi) => {
      const onclick = mi.getAttribute("onclick");
      if (onclick && onclick.includes("openAnomalies")) mi.classList.add("active");
    });

    if (typeof loadAnomalies === "function") {
      loadAnomalies();
    }
    window.scrollTo(0, 0);
  }

  async function saveAnomalie() {
    const title = document.getElementById("ano-title").value.trim();
    if (!title) {
      alert("⚠️ Veuillez saisir un titre.");
      return;
    }

    const { data, error } = await db.from("anomalies")
      .insert({
        technician_id: session.id,
        utility_name: document.getElementById("ano-utility").value || null,
        title,
        description: document.getElementById("ano-desc").value.trim(),
        priority: document.getElementById("ano-priority").value,
        status: "ouverte",
        created_at: new Date().toISOString()
      })
      .select("id")
      .single();

    if (error || !data?.id) {
      alert("Erreur : " + (error?.message || "L'enregistrement n'a pas pu être confirmé dans la base de données."));
      return;
    }

    document.getElementById("ano-title").value = "";
    document.getElementById("ano-desc").value = "";
    alert("✅ Anomalie déclarée !");
    loadAnomalies();
  }

  async function loadAnomalies() {
    const tbody = document.getElementById("anomalies-body");
    const info = document.getElementById("anomalies-info");
    if (!tbody) return;

    tbody.innerHTML = '<tr><td colspan="8">⏳ Chargement...</td></tr>';
    const filtre = document.getElementById("ano-filter").value;

    let query = db.from("anomalies")
      .select("*, technicians(first_name, last_name)")
      .order("created_at", { ascending: false })
      .limit(200);

    if (filtre) query = query.eq("status", filtre);

    const { data, error } = await query;

    if (error) {
      tbody.innerHTML = '<tr><td colspan="8">❌ Erreur : ' + error.message + '</td></tr>';
      return;
    }

    if (!data || data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="8">Aucune anomalie. 🎉</td></tr>';
      if (info) info.textContent = "";
      return;
    }

    const ouvertes = data.filter((a) => a.status !== "resolue").length;
    if (info) {
      info.textContent = data.length + " anomalie(s) — dont " + ouvertes + " non résolue(s)";
    }

    let html = "";
    for (const a of data) {
      const tech = a.technicians ? a.technicians.first_name + " " + a.technicians.last_name : "—";
      const date = new Date(a.created_at).toLocaleString("fr-FR");
      const resolue = a.resolved_at ? new Date(a.resolved_at).toLocaleString("fr-FR") : "—";
      const label = a.utility_name ? (ANO_LABELS[a.utility_name] || a.utility_name) : "— Générale —";

      const prioColor = a.priority === "Critique" ? "#ef4444" : a.priority === "Urgente" ? "#f59e0b" : "#94a3b8";
      const statusColor = a.status === "ouverte" ? "#ef4444" : a.status === "en cours" ? "#f59e0b" : "#22c55e";

      html += '<tr>'
        + '<td style="white-space:nowrap">' + date + '</td>'
        + '<td><strong>' + a.title + '</strong>'
        + (a.description ? '<br><span style="color:var(--muted);font-size:12px">' + a.description + '</span>' : '')
        + '</td>'
        + '<td style="white-space:nowrap">' + label + '</td>'
        + '<td style="color:' + prioColor + ';font-weight:bold">' + a.priority + '</td>'
        + '<td style="color:' + statusColor + ';font-weight:bold">' + a.status + '</td>'
        + '<td style="white-space:nowrap">' + tech + '</td>'
        + '<td style="white-space:nowrap">' + resolue + '</td>'
        + '<td style="white-space:nowrap">';

      if (a.status === "ouverte") {
        html += '<button class="btn btn-secondary" style="padding:6px 12px;font-size:12px" onclick="setStatus(' + a.id + ',\'en cours\')">🔧 En cours</button>';
      } else if (a.status === "en cours") {
        html += '<button class="btn btn-success" style="padding:6px 12px;font-size:12px" onclick="setStatus(' + a.id + ',\'resolue\')">✅ Résoudre</button>';
      } else {
        html += '<span style="color:#22c55e">✔</span>';
      }

      html += '</td></tr>';
    }

    tbody.innerHTML = html;
  }

  async function setStatus(id, status) {
    const update = { status };
    if (status === "resolue") update.resolved_at = new Date().toISOString();

    const { data, error } = await db.from("anomalies")
      .update(update)
      .eq("id", id)
      .select("id")
      .maybeSingle();
    if (error || !data?.id) {
      alert("Erreur : " + (error?.message || "Aucune anomalie n'a été modifiée."));
      return;
    }
    loadAnomalies();
  }

  let lastObservedPoste = null;

  async function refreshDashboardChecklistStatuses() {
    const cards = Array.from(document.querySelectorAll(".dashboard-card[data-checklist-id]"));
    if (!cards.length) return;

    const poste = currentPoste();
    const interval = getPosteInterval(poste);
    const { data, error } = await db.from("measurements")
      .select("id, utility_name, technician_id")
      .in("utility_name", cards.map((card) => card.dataset.checklistId))
      .eq("poste", poste)
      .gte("recorded_at", interval.start.toISOString())
      .lt("recorded_at", interval.end.toISOString())
      .order("recorded_at", { ascending: false });

    if (poste !== currentPoste()) return;

    if (error) {
      cards.forEach((card) => {
        card.classList.remove("is-locked");
        const status = card.querySelector(".dashboard-card-status");
        const editButton = card.querySelector(".dashboard-card-edit");
        if (status) {
          status.classList.remove("is-locked");
          status.textContent = "État indisponible";
        }
        if (editButton) {
          editButton.hidden = true;
          delete editButton.dataset.recordId;
        }
      });
      return;
    }

    const recordsByChecklist = new Map();
    for (const record of data || []) {
      if (!recordsByChecklist.has(record.utility_name)) {
        recordsByChecklist.set(record.utility_name, record);
      }
    }
    const session = getSession();
    cards.forEach((card) => {
      const record = recordsByChecklist.get(card.dataset.checklistId);
      const isLocked = Boolean(record);
      const status = card.querySelector(".dashboard-card-status");
      const editButton = card.querySelector(".dashboard-card-edit");
      card.classList.toggle("is-locked", isLocked);
      if (status) {
        status.classList.toggle("is-locked", isLocked);
        const hasDraft = !isLocked && typeof window.hasChecklistDraft === "function" && window.hasChecklistDraft(card.dataset.checklistId, poste);
        status.classList.toggle("is-draft", hasDraft);
        if (isLocked) {
          status.textContent = "🔒 Verrouillée pour ce poste";
        } else if (hasDraft) {
          status.textContent = "📝 Brouillon en cours";
        } else {
          status.textContent = "À remplir";
        }
      }
      if (editButton) {
        const canEdit = record && (session?.role === "admin" || session?.id === record.technician_id);
        editButton.hidden = !canEdit;
        if (canEdit) editButton.dataset.recordId = record.id;
        else delete editButton.dataset.recordId;
      }
    });
  }

  const grid = document.getElementById("menu-grid");
  if (grid && typeof CHECKLISTS !== "undefined") {
    grid.innerHTML = "";
    for (const id in CHECKLISTS) {
      const c = CHECKLISTS[id];
      grid.innerHTML += `
        <div class="dashboard-card" data-checklist-id="${id}" onclick="openChecklist('${id}')">
            <div class="dashboard-icon">${c.icon}</div>
            <h3>${c.title}</h3>
            <p>Check-list de contrôle.</p>
            <span class="dashboard-card-status">À remplir</span>
            <button class="btn btn-success dashboard-card-edit" type="button" hidden>Modifier</button>
        </div>`;
    }
        grid.innerHTML += `
          <div class="dashboard-card" onclick="openMaintenance()">
            <div class="dashboard-icon">🛠️</div>
            <h3>Maintenance</h3>
            <p>Suivi des tâches et interventions.</p>
          </div>`;
    grid.addEventListener("click", (event) => {
      const button = event.target.closest(".dashboard-card-edit");
      if (!button || button.hidden) return;
      event.preventDefault();
      event.stopPropagation();
      editChecklistRecord(button.dataset.recordId);
    });
  }

  const themeButton = document.getElementById("theme-btn");
  if (themeButton) {
    themeButton.addEventListener("click", () => {
      if (window.toggleTheme) {
        window.toggleTheme();
      }
    });
  }

  const mobileNav = document.getElementById("mobile-nav");
  if (mobileNav) {
    mobileNav.addEventListener("change", (event) => {
      const dest = event.target.value;
      if (dest) {
        mobileGo(dest);
      }
    });
  }

  assignActionHandlers();

  window.mobileGo = mobileGo;
  window.openHistory = openHistory;
  window.openMaintenance = openMaintenance;
  window.openAnomalies = openAnomalies;
  window.saveAnomalie = saveAnomalie;
  window.loadAnomalies = loadAnomalies;
  window.setStatus = setStatus;
  window.refreshDashboardChecklistStatuses = refreshDashboardChecklistStatuses;

  updateDateTime();
  const savedView = sessionStorage.getItem("dashboard-view");
  if (savedView === "history") openHistory();
  else if (savedView === "history-v2") openHistoryV2();
  else if (savedView === "maintenance") openMaintenance();
  else if (savedView === "water-consumption") openWaterConsumption();
  else if (savedView === "anomalies") openAnomalies();
  else showDashboard();
  setInterval(updateDateTime, 1000);
});
