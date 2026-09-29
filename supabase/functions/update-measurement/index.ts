const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (request.method !== "POST") {
    return jsonResponse({ error: "Méthode non autorisée." }, 405);
  }

  let body: {
    recordId?: string;
    technicianId?: string;
    matricule?: string;
    data?: Record<string, unknown>;
  };
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: "Requête invalide." }, 400);
  }

  if (
    !body.recordId || !body.technicianId || !body.matricule ||
    !body.data || typeof body.data !== "object" || Array.isArray(body.data)
  ) {
    return jsonResponse({ error: "Informations de modification incomplètes." }, 400);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) {
    return jsonResponse({ error: "Configuration serveur Supabase manquante." }, 500);
  }

  const apiUrl = `${supabaseUrl}/rest/v1`;
  const headers = {
    apikey: serviceRoleKey,
    Authorization: `Bearer ${serviceRoleKey}`,
    "Content-Type": "application/json",
  };

  const technicianParams = new URLSearchParams({
    select: "id,first_name,last_name,role",
    id: `eq.${body.technicianId}`,
    matricule: `eq.${body.matricule}`,
    is_active: "eq.true",
    limit: "1",
  });
  const technicianResponse = await fetch(`${apiUrl}/technicians?${technicianParams}`, { headers });
  if (!technicianResponse.ok) {
    return jsonResponse({ error: "Impossible de vérifier le technicien." }, 500);
  }
  const technicians = await technicianResponse.json();
  const technician = Array.isArray(technicians) ? technicians[0] : null;
  if (!technician) {
    return jsonResponse({ error: "Authentification invalide." }, 401);
  }

  const recordParams = new URLSearchParams({
    select: "id,technician_id,data",
    id: `eq.${body.recordId}`,
    limit: "1",
  });
  const recordResponse = await fetch(`${apiUrl}/measurements?${recordParams}`, { headers });
  if (!recordResponse.ok) {
    return jsonResponse({ error: "Impossible de charger ce relevé." }, 500);
  }
  const records = await recordResponse.json();
  const record = Array.isArray(records) ? records[0] : null;
  if (!record) {
    return jsonResponse({ error: "Ce relevé est introuvable." }, 404);
  }
  if (technician.role !== "admin" && record.technician_id !== technician.id) {
    return jsonResponse({ error: "Vous pouvez uniquement modifier vos propres saisies." }, 403);
  }

  const previousModifications = Array.isArray(record.data?._modifications)
    ? record.data._modifications
    : [];
  const modifications = [
    ...previousModifications,
    {
      first_name: technician.first_name || "",
      last_name: technician.last_name || "",
      edited_at: new Date().toISOString(),
    },
  ];

  const updateResponse = await fetch(
    `${apiUrl}/measurements?id=eq.${encodeURIComponent(record.id)}`,
    {
      method: "PATCH",
      headers: { ...headers, Prefer: "return=representation" },
      body: JSON.stringify({ data: { ...body.data, _modifications: modifications } }),
    },
  );

  if (!updateResponse.ok) {
    return jsonResponse({ error: "Erreur lors de la mise à jour du relevé." }, 500);
  }
  const updated = await updateResponse.json();
  if (!Array.isArray(updated) || updated.length === 0) {
    return jsonResponse({ error: "Aucun relevé n'a été modifié." }, 404);
  }

  return jsonResponse({ success: true });
});
