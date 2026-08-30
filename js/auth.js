// =====================================================
// Session & sécurité — Plant Pulse
// =====================================================

// --- Lire la session ---
function getSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

// --- Enregistrer la session ---
function setSession(session) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

// --- Supprimer la session (déconnexion) ---
function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

// --- Protection : page accessible uniquement si connecté ---
function requireAuth() {
  const session = getSession();
  if (!session) {
    window.location.href = "index.html";
    return null;
  }
  return session;
}

// --- Protection : page accessible uniquement si admin ---
function requireAdmin() {
  const session = requireAuth();
  if (!session) return null;
  if (session.role !== "admin") {
    window.location.href = "dashboard.html";
    return null;
  }
  return session;
}

// --- Déconnexion ---
function logout() {
  clearSession();
  window.location.href = "index.html";
}
