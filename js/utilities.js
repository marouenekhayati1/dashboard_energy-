// =====================================================
// Utilités, postes de garde, seuils — Plant Pulse
// =====================================================

// --- Les 10 utilités ---
const UTILITIES = [
  { id: "generator_g1", name: "Groupe Électrogène 1", icon: "⚡", tag: "GE1" },
  { id: "generator_g2", name: "Groupe Électrogène 2", icon: "⚡", tag: "GE2" },
  { id: "transformer", name: "Transformateur", icon: "🔌", tag: "TR" },
  { id: "water_treatment", name: "Traitement d'eau", icon: "💧", tag: "TW" },
  { id: "air_compressor", name: "Compresseur d'air", icon: "🌬️", tag: "CA" },
  { id: "boiler", name: "Chaudière", icon: "🔥", tag: "CH" },
  { id: "hvac", name: "CVC / Ventilation", icon: "🌀", tag: "CVC" },
  { id: "fire_system", name: "Anti-incendie", icon: "🚒", tag: "SI" },
  { id: "waste_treatment", name: "Traitement des rejets", icon: "♻️", tag: "TRJ" },
  { id: "lighting", name: "Éclairage", icon: "💡", tag: "EC" }
];

function getUtility(id) {
  return UTILITIES.find((u) => u.id === id) || null;
}

// --- Poste de garde : 1 (6h-14h), 2 (14h-20h), 3 (20h-6h) ---
function getGuardPost(date = new Date()) {
  const h = date.getHours();
  if (h >= 6 && h < 14) return 1;
  if (h >= 14 && h < 20) return 2;
  return 3;
}

// --- Statut d'une valeur selon les seuils ---
// threshold = { warn_min, warn_max, max } (vient de la table "thresholds")
function getThresholdStatus(value, threshold) {
  if (!threshold) return "ok";
  if (threshold.max != null && value >= threshold.max) return "critical";
  if (threshold.warn != null && value >= threshold.warn) return "warning";
  return "ok";
}

// --- Couleurs des statuts ---
const STATUS_CONFIG = {
  ok: { label: "Normal", color: "#34d399" },
  warning: { label: "Attention", color: "#fb923c" },
  critical: { label: "Critique", color: "#f87171" }
};

// --- Format date/heure ---
function formatDateTime(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString("fr-FR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit"
  });
}

function formatNumber(value, decimals = 1) {
  if (value == null || isNaN(value)) return "—";
  return Number(value).toLocaleString("fr-FR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
}
