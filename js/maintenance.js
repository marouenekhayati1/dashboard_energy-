const MAINTENANCE_UTILITIES = [
  {
    id: "water",
    label: "Traitement d'eau",
    equipment: ["Pompe 1", "Pompe 2", "Filtres", "Réacteur UV1", "Réacteur UV2", "Réacteur UV3", "Adoucisseur 1", "Adoucisseur 2"]
  },
  {
    id: "surchauffee",
    label: "Eau surchauffée",
    equipment: ["Chaudière Mingazzini", "Chaudière ICI", "Circuit R2", "Pompe ES 1", "Pompe ES 2", "Pompe ES 3", "Pompe ECh 1", "Pompe ECh 2"]
  },
  {
    id: "vapeur",
    label: "Chaudière vapeur",
    equipment: ["Chaudière Mingazzini", "Chaudière Alsthom"]
  },
  {
    id: "vide",
    label: "Pompe à vide",
    equipment: ["Pompe à vide 1", "Pompe à vide 2", "Pompe à vide 3", "Pompe à vide 4"]
  },
  {
    id: "compresseurs",
    label: "Compresseurs d'air",
    equipment: ["Compresseur 2", "Compresseur 3", "Compresseur 4", "Compresseur 5", "Compresseur 6", "Compresseur 7", "Sécheur 1", "Sécheur 2", "Sécheur 3", "Sécheur 4", "Sécheur 5"]
  },
  {
    id: "glacee",
    label: "Eau glacée - Trane",
    equipment: ["Trane", "Compresseur 1", "Compresseur 2", "Pompe à vide"]
  },
  {
    id: "chiller",
    label: "Eau glacée - Chiller",
    equipment: ["Chiller à absorption", "Tour de refroidissement"]
  },
  {
    id: "york",
    label: "Eau glacée - York",
    equipment: ["York", "Compresseur 1", "Compresseur 2"]
  },
  {
    id: "thermo",
    label: "Thermoventilation",
    equipment: ["Thermoventilateur Fab 1", "Thermoventilateur Fab 2", "Thermoventilateur PS"]
  },
  {
    id: "groupes",
    label: "Groupes électrogènes",
    equipment: ["Groupe électrogène 1", "Groupe électrogène 2"]
  },
  {
    id: "osmose",
    label: "Station d'osmose",
    equipment: ["Station d'osmose", "Réservoir de dosage 1", "Réservoir de dosage 2", "Filtre avant filtre charbon", "Filtres après filtre charbon", "Filtre charbon"]
  }
];

(() => {
  let maintenanceTasks = [];
  let maintenanceLogs = [];
  let editingMaintenanceLog = null;
  let maintenanceSaveInProgress = false;

  function escapeMaintenanceHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (character) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[character]);
  }

  function showMaintenanceMessage(message = "", isError = true) {
    const box = document.getElementById("maintenance-message");
    if (!box) return;
    box.textContent = message;
    box.hidden = !message;
    box.classList.toggle("status", !isError);
    box.classList.toggle("error", isError && Boolean(message));
    box.classList.toggle("ok", !isError && Boolean(message));
  }

  function selectedUtility() {
    return MAINTENANCE_UTILITIES.find((utility) => utility.id === document.getElementById("maintenance-utility")?.value);
  }

  function hasOperatingHourCounter(utilityId, equipmentName) {
    if (utilityId === "groupes" || utilityId === "vide" || equipmentName.startsWith("Pompe à vide")) return true;
    return utilityId === "compresseurs" && equipmentName.startsWith("Compresseur ");
  }

  function updateEquipmentControls() {
    const utility = selectedUtility();
    const equipmentSelect = document.getElementById("maintenance-equipment");
    const taskSelect = document.getElementById("maintenance-task");
    const addTaskButton = document.getElementById("maintenance-show-new-task");
    const hoursInput = document.getElementById("maintenance-hours");
    const saveButton = document.getElementById("maintenance-save");

    const equipmentName = equipmentSelect.value;
    const hasEquipment = Boolean(utility && equipmentName);
    const hasCounter = hasOperatingHourCounter(utility?.id || "", equipmentName);
    equipmentSelect.innerHTML = utility
      ? '<option value="">— Sélectionner un équipement —</option>' + utility.equipment.map((name) => `<option value="${escapeMaintenanceHtml(name)}">${escapeMaintenanceHtml(name)}</option>`).join("")
      : '<option value="">— Sélectionner une utilité d’abord —</option>';
    if (hasEquipment) equipmentSelect.value = equipmentName;

    taskSelect.disabled = true;
    addTaskButton.disabled = !hasEquipment;
    hoursInput.disabled = !hasEquipment || !hasCounter;
    hoursInput.required = hasEquipment && hasCounter;
    hoursInput.placeholder = hasCounter ? "Saisir le compteur actuel" : "Non disponible pour cet équipement";
    if (!hasCounter) hoursInput.value = "";
    saveButton.disabled = true;

    if (!hasEquipment) {
      taskSelect.innerHTML = '<option value="">— Sélectionner un équipement d’abord —</option>';
      document.getElementById("maintenance-new-task-row").classList.add("hidden");
    }
  }

  async function loadTasks() {
    const utility = selectedUtility();
    const equipmentName = document.getElementById("maintenance-equipment").value;
    const taskSelect = document.getElementById("maintenance-task");
    const addTaskButton = document.getElementById("maintenance-show-new-task");
    const saveButton = document.getElementById("maintenance-save");
    maintenanceTasks = [];
    taskSelect.disabled = true;
    saveButton.disabled = true;
    if (!utility || !equipmentName || !window.db) return;

    taskSelect.innerHTML = '<option value="">Chargement des tâches...</option>';
    const { data, error } = await window.db.from("maintenance_tasks")
      .select("id,title")
      .eq("utility_name", utility.id)
      .eq("equipment_name", equipmentName)
      .order("title");

    if (error) {
      taskSelect.innerHTML = '<option value="">Impossible de charger les tâches</option>';
      showMaintenanceMessage("Erreur de chargement des tâches : " + error.message);
      return;
    }

    maintenanceTasks = data || [];
    taskSelect.innerHTML = '<option value="">— Sélectionner une tâche —</option>' + maintenanceTasks.map((task) => `<option value="${escapeMaintenanceHtml(task.id)}">${escapeMaintenanceHtml(task.title)}</option>`).join("");
    taskSelect.disabled = false;
    addTaskButton.disabled = false;
    if (!maintenanceTasks.length) {
      showMaintenanceMessage("Aucune tâche n'existe encore pour cet équipement. Ajoute la première tâche.", false);
      document.getElementById("maintenance-new-task-row").classList.remove("hidden");
    } else {
      showMaintenanceMessage("");
    }
  }

  async function addMaintenanceTask() {
    const utility = selectedUtility();
    const equipmentName = document.getElementById("maintenance-equipment").value;
    const titleInput = document.getElementById("maintenance-new-task");
    const title = titleInput.value.trim();
    if (!utility || !equipmentName || !title) {
      showMaintenanceMessage("Sélectionne une utilité, un équipement et saisis le nom de la tâche.");
      return;
    }

    const existing = maintenanceTasks.find((task) => task.title.toLocaleLowerCase("fr-FR") === title.toLocaleLowerCase("fr-FR"));
    if (existing) {
      document.getElementById("maintenance-task").value = existing.id;
      document.getElementById("maintenance-save").disabled = false;
      document.getElementById("maintenance-new-task-row").classList.add("hidden");
      titleInput.value = "";
      showMaintenanceMessage("Cette tâche existe déjà pour cet équipement; elle est sélectionnée.", false);
      return;
    }

    const session = getSession();
    const { data, error } = await window.db.from("maintenance_tasks").insert({
      utility_name: utility.id,
      utility_label: utility.label,
      equipment_name: equipmentName,
      title,
      created_by: String(session?.id || "")
    }).select("id,title").single();

    if (error) {
      if (error.code === "23505") {
        await loadTasks();
        const duplicate = maintenanceTasks.find((task) => task.title.toLocaleLowerCase("fr-FR") === title.toLocaleLowerCase("fr-FR"));
        if (duplicate) {
          document.getElementById("maintenance-task").value = duplicate.id;
          document.getElementById("maintenance-save").disabled = false;
          document.getElementById("maintenance-new-task-row").classList.add("hidden");
          titleInput.value = "";
          showMaintenanceMessage("Cette tâche existe déjà; elle est sélectionnée.", false);
          return;
        }
      }
      showMaintenanceMessage("Erreur lors de l'ajout de la tâche : " + error.message);
      return;
    }

    maintenanceTasks.push(data);
    const taskSelect = document.getElementById("maintenance-task");
    taskSelect.add(new Option(data.title, data.id));
    taskSelect.value = data.id;
    document.getElementById("maintenance-save").disabled = false;
    document.getElementById("maintenance-new-task-row").classList.add("hidden");
    titleInput.value = "";
    showMaintenanceMessage("Tâche ajoutée et sélectionnée.", false);
  }

  function localDateString(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  }

  function posteLabel(poste) {
    if (poste === "matin") return "Matin";
    if (poste === "apres-midi") return "Après-midi";
    if (poste === "nuit") return "Nuit";
    return "—";
  }

  function cancelMaintenanceEdit() {
    editingMaintenanceLog = null;
    const utilitySelect = document.getElementById("maintenance-utility");
    const equipmentSelect = document.getElementById("maintenance-equipment");
    const taskSelect = document.getElementById("maintenance-task");
    const addTaskButton = document.getElementById("maintenance-show-new-task");
    const hoursInput = document.getElementById("maintenance-hours");
    const saveButton = document.getElementById("maintenance-save");
    const dateInput = document.getElementById("maintenance-date");

    utilitySelect.disabled = false;
    utilitySelect.value = "";
    equipmentSelect.disabled = true;
    equipmentSelect.innerHTML = '<option value="">— Sélectionner une utilité d’abord —</option>';
    taskSelect.disabled = true;
    taskSelect.innerHTML = '<option value="">— Sélectionner un équipement d’abord —</option>';
    addTaskButton.disabled = true;
    document.getElementById("maintenance-new-task-row").classList.add("hidden");
    hoursInput.value = "";
    hoursInput.disabled = true;
    hoursInput.required = false;
    document.getElementById("maintenance-work-order").value = "";
    document.getElementById("maintenance-comment").value = "";
    document.getElementById("maintenance-time-mode").value = "realtime";
    dateInput.value = "";
    dateInput.disabled = true;
    dateInput.required = false;
    document.getElementById("maintenance-date-group").classList.add("hidden");
    document.getElementById("maintenance-cancel-edit").hidden = true;
    saveButton.textContent = "Enregistrer l'intervention";
    saveButton.disabled = true;
    showMaintenanceMessage("");
  }

  async function editMaintenanceLog(recordId) {
    if (maintenanceSaveInProgress) return;
    const record = maintenanceLogs.find((item) => String(item.id) === String(recordId));
    const session = getSession();
    if (!record || !(session?.role === "admin" || String(session?.id) === String(record.technician_id))) {
      showMaintenanceMessage("Vous pouvez uniquement modifier vos propres interventions.");
      return;
    }

    const utility = MAINTENANCE_UTILITIES.find((item) => item.id === record.utility_name);
    if (!utility || !utility.equipment.includes(record.equipment_name)) {
      showMaintenanceMessage("L'utilité ou l'équipement de cette intervention n'est plus disponible.");
      return;
    }

    editingMaintenanceLog = record;
    const utilitySelect = document.getElementById("maintenance-utility");
    const equipmentSelect = document.getElementById("maintenance-equipment");
    const addTaskButton = document.getElementById("maintenance-show-new-task");
    utilitySelect.value = utility.id;
    utilitySelect.disabled = true;
    equipmentSelect.innerHTML = '<option value="">— Sélectionner un équipement —</option>' + utility.equipment.map((name) => `<option value="${escapeMaintenanceHtml(name)}">${escapeMaintenanceHtml(name)}</option>`).join("");
    equipmentSelect.value = record.equipment_name;
    equipmentSelect.disabled = true;
    updateEquipmentControls();
    utilitySelect.disabled = true;
    equipmentSelect.disabled = true;
    addTaskButton.disabled = true;
    document.getElementById("maintenance-new-task-row").classList.add("hidden");
    await loadTasks();

    if (!maintenanceTasks.some((task) => String(task.id) === String(record.task_id))) {
      cancelMaintenanceEdit();
      showMaintenanceMessage("La tâche de cette intervention n'existe plus pour cet équipement.");
      return;
    }

    document.getElementById("maintenance-task").value = record.task_id;
    document.getElementById("maintenance-hours").value = record.operating_hours ?? "";
    document.getElementById("maintenance-work-order").value = record.work_order_number || "";
    document.getElementById("maintenance-comment").value = record.comment || "";
    document.getElementById("maintenance-time-mode").value = "manual";
    const dateInput = document.getElementById("maintenance-date");
    dateInput.value = record.maintenance_date;
    dateInput.disabled = false;
    dateInput.required = true;
    document.getElementById("maintenance-date-group").classList.remove("hidden");
    document.getElementById("maintenance-cancel-edit").hidden = false;
    const saveButton = document.getElementById("maintenance-save");
    saveButton.disabled = false;
    saveButton.textContent = "Enregistrer les modifications";
    showMaintenanceMessage("Modification de l'intervention sélectionnée.", false);
    document.getElementById("maintenance-zone").scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function saveMaintenanceLog() {
    if (maintenanceSaveInProgress) return;

    const utility = selectedUtility();
    const equipmentName = document.getElementById("maintenance-equipment").value;
    const taskId = document.getElementById("maintenance-task").value;
    const task = maintenanceTasks.find((item) => item.id === taskId);
    const taskSelect = document.getElementById("maintenance-task");
    const saveButton = document.getElementById("maintenance-save");
    const hoursInput = document.getElementById("maintenance-hours");
    const timeMode = document.getElementById("maintenance-time-mode").value;
    const selectedDate = document.getElementById("maintenance-date").value;
    const workOrderNumber = document.getElementById("maintenance-work-order").value.trim();
    const comment = document.getElementById("maintenance-comment").value.trim();
    const hasCounter = hasOperatingHourCounter(utility?.id || "", equipmentName);
    const hours = hoursInput.value.trim();

    if (!utility || !equipmentName || !task) {
      showMaintenanceMessage("Sélectionne l'utilité, l'équipement et une tâche.");
      return;
    }
    if (hasCounter && (!hours || !Number.isFinite(Number(hours)) || Number(hours) < 0)) {
      showMaintenanceMessage("Saisis un compteur d'heures valide pour cet équipement.");
      hoursInput.focus();
      return;
    }
    if (timeMode === "manual" && !selectedDate) {
      showMaintenanceMessage("Sélectionne la date de l'intervention.");
      document.getElementById("maintenance-date").focus();
      return;
    }

    const session = getSession();
    const now = new Date();
    const poste = currentPoste();
    const editingRecord = editingMaintenanceLog;
    maintenanceSaveInProgress = true;
    saveButton.disabled = true;
    saveButton.textContent = "Enregistrement...";

    try {
      let error = null;
      if (editingRecord) {
        const { data, error: updateError } = await window.db.rpc("update_maintenance_log", {
          p_record_id: editingRecord.id,
          p_technician_id: String(session?.id || ""),
          p_matricule: String(session?.matricule || ""),
          p_task_id: task.id,
          p_operating_hours: hasCounter ? Number(hours) : null,
          p_maintenance_date: timeMode === "manual" ? selectedDate : localDateString(now),
          p_work_order_number: workOrderNumber || null,
          p_comment: comment
        });
        error = updateError || (data?.success ? null : { message: "La modification n'a pas été appliquée." });
      } else {
        ({ error } = await window.db.from("maintenance_logs").insert({
          task_id: task.id,
          utility_name: utility.id,
          utility_label: utility.label,
          equipment_name: equipmentName,
          task_title: task.title,
          operating_hours: hasCounter ? Number(hours) : null,
          maintenance_date: timeMode === "manual" ? selectedDate : localDateString(now),
          poste,
          work_order_number: workOrderNumber || null,
          comment,
          technician_id: String(session?.id || ""),
          technician_name: [session?.first_name, session?.last_name].filter(Boolean).join(" ")
        }));
      }

      if (error) {
        showMaintenanceMessage("Erreur lors de l'enregistrement : " + error.message);
        return;
      }

      hoursInput.value = "";
      taskSelect.value = "";
      document.getElementById("maintenance-work-order").value = "";
      document.getElementById("maintenance-comment").value = "";
      if (editingRecord) {
        cancelMaintenanceEdit();
      }
      showMaintenanceMessage(editingRecord ? "Modifications enregistrées." : "Intervention enregistrée. La date et le poste ont été enregistrés.", false);
      await loadMaintenanceLogs();
    } catch (error) {
      showMaintenanceMessage("Erreur lors de l'enregistrement : " + error.message);
    } finally {
      maintenanceSaveInProgress = false;
      saveButton.textContent = editingMaintenanceLog ? "Enregistrer les modifications" : "Enregistrer l'intervention";
      saveButton.disabled = !taskSelect.value;
    }
  }

  async function loadMaintenanceLogs() {
    const body = document.getElementById("maintenance-log-body");
    const info = document.getElementById("maintenance-info");
    if (!body || !window.db) return;
    body.innerHTML = '<tr><td colspan="10">Chargement...</td></tr>';
    const { data, error } = await window.db.from("maintenance_logs")
      .select("id,task_id,technician_id,utility_name,utility_label,equipment_name,task_title,operating_hours,maintenance_date,poste,work_order_number,comment,technician_name")
      .order("maintenance_date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(200);

    if (error) {
      body.innerHTML = '<tr><td colspan="10">Erreur de chargement des interventions.</td></tr>';
      if (info) info.textContent = error.message;
      return;
    }

    if (!data?.length) {
      maintenanceLogs = [];
      body.innerHTML = '<tr><td colspan="10">Aucune intervention enregistrée.</td></tr>';
      if (info) info.textContent = "";
      return;
    }

    maintenanceLogs = data;
    const session = getSession();
    body.innerHTML = data.map((log) => {
      const date = new Date(`${log.maintenance_date}T12:00:00`).toLocaleDateString("fr-FR");
      const hours = log.operating_hours === null || log.operating_hours === undefined ? "—" : `${Number(log.operating_hours).toLocaleString("fr-FR")} h`;
      const canEdit = session?.role === "admin" || String(session?.id) === String(log.technician_id);
      return `<tr>
        <td style="white-space:nowrap">${escapeMaintenanceHtml(date)}</td>
        <td>${escapeMaintenanceHtml(posteLabel(log.poste))}</td>
        <td>${escapeMaintenanceHtml(log.utility_label)}</td>
        <td>${escapeMaintenanceHtml(log.equipment_name)}</td>
        <td>${escapeMaintenanceHtml(log.task_title)}</td>
        <td>${escapeMaintenanceHtml(hours)}</td>
        <td>${escapeMaintenanceHtml(log.work_order_number || "—")}</td>
        <td>${escapeMaintenanceHtml(log.comment || "—")}</td>
        <td>${escapeMaintenanceHtml(log.technician_name)}</td>
        <td>${canEdit ? `<button class="btn btn-success" type="button" data-maintenance-edit="${escapeMaintenanceHtml(log.id)}">Modifier</button>` : "—"}</td>
      </tr>`;
    }).join("");
    if (info) info.textContent = `${data.length} intervention(s) récente(s)`;
  }

  async function loadMaintenance() {
    if (!window.db) {
      showMaintenanceMessage("La connexion à la base de données n'est pas disponible.");
      return;
    }
    await loadMaintenanceLogs();
  }

  document.addEventListener("DOMContentLoaded", () => {
    const utilitySelect = document.getElementById("maintenance-utility");
    const equipmentSelect = document.getElementById("maintenance-equipment");
    const taskSelect = document.getElementById("maintenance-task");
    const hoursInput = document.getElementById("maintenance-hours");
    const addTaskButton = document.getElementById("maintenance-show-new-task");
    const newTaskRow = document.getElementById("maintenance-new-task-row");
    const newTaskInput = document.getElementById("maintenance-new-task");
    const saveButton = document.getElementById("maintenance-save");
    const cancelEditButton = document.getElementById("maintenance-cancel-edit");
    const timeModeSelect = document.getElementById("maintenance-time-mode");
    const dateGroup = document.getElementById("maintenance-date-group");
    const dateInput = document.getElementById("maintenance-date");

    function updateMaintenanceDateMode() {
      const chooseDate = timeModeSelect.value === "manual";
      dateGroup.classList.toggle("hidden", !chooseDate);
      dateInput.disabled = !chooseDate;
      dateInput.required = chooseDate;
      if (!chooseDate) dateInput.value = "";
    }

    timeModeSelect.addEventListener("change", updateMaintenanceDateMode);
    updateMaintenanceDateMode();

    utilitySelect.innerHTML += MAINTENANCE_UTILITIES.map((utility) => `<option value="${utility.id}">${escapeMaintenanceHtml(utility.label)}</option>`).join("");
    utilitySelect.addEventListener("change", () => {
      const utility = selectedUtility();
      equipmentSelect.innerHTML = utility
        ? '<option value="">— Sélectionner un équipement —</option>' + utility.equipment.map((name) => `<option value="${escapeMaintenanceHtml(name)}">${escapeMaintenanceHtml(name)}</option>`).join("")
        : '<option value="">— Sélectionner une utilité d’abord —</option>';
      equipmentSelect.disabled = !utility;
      taskSelect.disabled = true;
      taskSelect.innerHTML = '<option value="">— Sélectionner un équipement d’abord —</option>';
      addTaskButton.disabled = true;
      saveButton.disabled = true;
      newTaskRow.classList.add("hidden");
      hoursInput.value = "";
      hoursInput.disabled = true;
      showMaintenanceMessage("");
    });

    equipmentSelect.addEventListener("change", async () => {
      newTaskRow.classList.add("hidden");
      document.getElementById("maintenance-new-task").value = "";
      updateEquipmentControls();
      if (equipmentSelect.value) await loadTasks();
    });

    taskSelect.addEventListener("change", () => {
      saveButton.disabled = !taskSelect.value;
      showMaintenanceMessage("");
    });

    addTaskButton.addEventListener("click", () => {
      newTaskRow.classList.toggle("hidden");
      if (!newTaskRow.classList.contains("hidden")) newTaskInput.focus();
    });
    document.getElementById("maintenance-add-task").addEventListener("click", addMaintenanceTask);
    newTaskInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        addMaintenanceTask();
      }
    });
    saveButton.addEventListener("click", saveMaintenanceLog);
    cancelEditButton.addEventListener("click", cancelMaintenanceEdit);
    document.getElementById("maintenance-log-body").addEventListener("click", (event) => {
      const editButton = event.target.closest("[data-maintenance-edit]");
      if (editButton) editMaintenanceLog(editButton.dataset.maintenanceEdit);
    });
    hoursInput.addEventListener("input", () => showMaintenanceMessage(""));
  });

  window.loadMaintenance = loadMaintenance;
})();
