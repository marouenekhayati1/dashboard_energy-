document.addEventListener("DOMContentLoaded", () => {
  const theme = localStorage.getItem("theme") || "dark";
  document.documentElement.setAttribute("data-theme", theme);

  const loginForm = document.getElementById("login-form");
  const select = document.getElementById("login-tech");
  const matriculeInput = document.getElementById("login-matricule");
  const errorBox = document.getElementById("login-error");

  function showError(msg) {
    errorBox.textContent = msg;
    errorBox.classList.remove("hidden");
  }

  async function loadTechnicians() {
    const { data, error } = await SupabaseService.fetchTechnicians();

    if (error || !data || data.length === 0) {
      select.innerHTML = "<option>Aucun technicien</option>";
      return;
    }

    let html = '<option value="">— Sélectionner —</option>';
    data.forEach((tech) => {
      html += `<option value="${tech.id}">${tech.first_name} ${tech.last_name}</option>`;
    });
    select.innerHTML = html;
  }

  async function doLogin() {
    errorBox.classList.add("hidden");

    const technician = select.value;
    const matricule = matriculeInput.value.trim();

    if (!technician) {
      showError("Sélectionnez un technicien.");
      return;
    }

    if (!matricule) {
      showError("Entrez votre matricule.");
      return;
    }

    const { data, error } = await SupabaseService.getTechnicianByCredentials(technician, matricule);

    if (error) {
      showError(error.message);
      return;
    }

    if (!data) {
      showError("Matricule incorrect.");
      return;
    }

    setSession({
      id: data.id,
      first_name: data.first_name,
      last_name: data.last_name,
      matricule: data.matricule,
      role: data.role
    });

    window.location.href = "dashboard.html";
  }

  if (getSession()) {
    window.location.href = "dashboard.html";
    return;
  }

  loadTechnicians();

  if (loginForm) {
    loginForm.addEventListener("submit", (event) => {
      event.preventDefault();
      doLogin();
    });
  }

  const actionButton = document.getElementById("login-button");
  if (actionButton) {
    actionButton.addEventListener("click", doLogin);
  }

  matriculeInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      doLogin();
    }
  });
});
