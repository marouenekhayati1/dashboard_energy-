document.addEventListener("DOMContentLoaded", () => {
  const theme = localStorage.getItem("theme") || "dark";
  document.documentElement.setAttribute("data-theme", theme);

  const form = document.getElementById("register-form");
  const errorBox = document.getElementById("reg-error");

  function showError(msg) {
    errorBox.textContent = msg;
    errorBox.classList.remove("hidden");
  }

  async function doRegister() {
    errorBox.classList.add("hidden");

    const first = document.getElementById("reg-first").value.trim();
    const last = document.getElementById("reg-last").value.trim();
    const matricule = document.getElementById("reg-matricule").value.trim();

    if (!first || !last) {
      showError("Entrez votre prénom et votre nom.");
      return;
    }

    if (!matricule) {
      showError("Entrez un matricule.");
      return;
    }

    const { data: existing, error: checkError } = await SupabaseService.checkMatriculeExists(matricule);

    if (checkError) {
      showError(checkError.message);
      return;
    }

    if (existing) {
      showError("Ce matricule est déjà utilisé.");
      return;
    }

    const { error } = await SupabaseService.registerTechnician({
      first_name: first,
      last_name: last,
      matricule
    });

    if (error) {
      showError(error.message);
      return;
    }

    alert("✅ Compte créé !");
    window.location.href = "index.html";
  }

  if (form) {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      doRegister();
    });
  }

  const button = document.getElementById("register-button");
  if (button) {
    button.addEventListener("click", doRegister);
  }
});
