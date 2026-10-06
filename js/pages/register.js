document.addEventListener("DOMContentLoaded", () => {
  const theme = localStorage.getItem("theme") || "dark";
  document.documentElement.setAttribute("data-theme", theme);

  const form = document.getElementById("register-form");
  const errorBox = document.getElementById("reg-error");
  const button = document.getElementById("register-button");
  let registrationInProgress = false;

  function showError(msg) {
    errorBox.textContent = msg;
    errorBox.classList.remove("hidden");
  }

  async function doRegister() {
    if (registrationInProgress) return;
    registrationInProgress = true;
    if (button) button.disabled = true;
    errorBox.classList.add("hidden");

    try {
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

      const { data, error } = await SupabaseService.registerTechnician({
        first_name: first,
        last_name: last,
        matricule
      });

      if (error || !data?.id) {
        showError(error?.message || "Le compte n'a pas pu être confirmé dans la base de données.");
        return;
      }

      alert("✅ Compte créé !");
      window.location.href = "index.html";
    } catch (error) {
      showError("Erreur lors de la création du compte : " + error.message);
    } finally {
      registrationInProgress = false;
      if (button) button.disabled = false;
    }
  }

  if (form) {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      doRegister();
    });
  }
});
