(function () {
  const THEME_KEY = "theme";

  function getTheme() {
    return localStorage.getItem(THEME_KEY) || "dark";
  }

  function applyTheme(theme) {
    const normalized = theme === "light" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", normalized);
    localStorage.setItem(THEME_KEY, normalized);
    updateThemeButtons();
    return normalized;
  }

  function toggleTheme() {
    const current = document.documentElement.getAttribute("data-theme") === "light" ? "dark" : "light";
    return applyTheme(current);
  }

  function updateThemeButtons() {
    const isLight = document.documentElement.getAttribute("data-theme") === "light";
    const buttons = document.querySelectorAll("[data-theme-toggle]");

    buttons.forEach((button) => {
      button.textContent = isLight ? "☀️" : "🌙";
      button.setAttribute("aria-label", isLight ? "Passer au thème sombre" : "Passer au thème clair");
    });
  }

  function initTheme() {
    const savedTheme = getTheme();
    document.documentElement.setAttribute("data-theme", savedTheme);
    updateThemeButtons();
  }

  window.toggleTheme = toggleTheme;
  window.updateThemeBtn = updateThemeButtons;
  window.initTheme = initTheme;

  window.IndusTheme = {
    THEME_KEY,
    getTheme,
    applyTheme,
    toggleTheme,
    initTheme,
    updateThemeButtons
  };
})();
