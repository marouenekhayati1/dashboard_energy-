// =====================================================
// AppShell — Header + Navigation commune — Plant Pulse
// =====================================================

const NAV_ITEMS = [
  { id: "dashboard", label: "Tableau de bord", file: "dashboard.html", icon: "📊", adminOnly: false },
  { id: "entry", label: "Saisie", file: "entry.html", icon: "📝", adminOnly: false },
  { id: "energie", label: "Énergie", file: "energie.html", icon: "⚡", adminOnly: false },
  { id: "history", label: "Historique", file: "history.html", icon: "🕘", adminOnly: false },
  { id: "admin", label: "Admin", file: "admin.html", icon: "⚙️", adminOnly: true }
];

// Initialise header + nav dans <div id="app-shell"></div>
function initAppShell(pageId, user) {
  const shell = document.getElementById("app-shell");
  if (!shell || !user) return;

  const initials = (user.first_name[0] + (user.last_name[0] || "")).toUpperCase();
  const roleName = user.role === "admin" ? "Administrateur" : "Technicien";

  // --- Filtrer la nav selon le rôle ---
  const links = NAV_ITEMS
    .filter((n) => !n.adminOnly || user.role === "admin")
    .map((n) =>
      `<a href="n.file"class="{n.file}" class="n.file"class="{n.id === pageId ? "active" : ""}">n.icon{n.icon}n.icon{n.label}</a>`
    )
    .join("");

  shell.innerHTML = `
    <header class="app-header">
      <div class="brand">
        <div class="logo">⚡</div>
        <div>
          INDUS <small>· Monitoring</small>
        </div>
      </div>
      <div class="user-badge">
        <div style="text-align:right">
          <div style="font-size:14px;font-weight:600">user.firstname{user.first_name}user.firstn​ame{user.last_name}</div>
          <div style="font-size:11px;color:var(--text-muted)">${roleName}</div>
        </div>
        <div class="avatar">${initials}</div>
        <button class="btn btn-danger" onclick="logout()" title="Déconnexion">⎋</button>
      </div>
    </header>
    <nav class="nav">${links}</nav>
  `;
}
