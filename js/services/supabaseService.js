const SupabaseService = (() => {
  function getClient() {
    if (!window.supabase) {
      throw new Error("Supabase n'est pas chargé.");
    }

    return window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }

  async function fetchTechnicians() {
    const db = getClient();
    const { data, error } = await db
      .from("technicians")
      .select("*")
      .eq("is_active", true)
      .order("first_name");

    return { data, error };
  }

  async function getTechnicianByCredentials(technicianId, matricule) {
    const db = getClient();
    const { data, error } = await db
      .from("technicians")
      .select("*")
      .eq("id", technicianId)
      .eq("matricule", matricule)
      .eq("is_active", true)
      .maybeSingle();

    return { data, error };
  }

  async function registerTechnician({ first_name, last_name, matricule }) {
    const db = getClient();
    return db.from("technicians")
      .insert({
        first_name,
        last_name,
        matricule,
        role: "technician",
        is_active: true
      })
      .select("id")
      .single();
  }

  async function checkMatriculeExists(matricule) {
    const db = getClient();
    const { data, error } = await db
      .from("technicians")
      .select("id")
      .eq("matricule", matricule)
      .maybeSingle();

    return { data, error };
  }

  return {
    getClient,
    fetchTechnicians,
    getTechnicianByCredentials,
    registerTechnician,
    checkMatriculeExists
  };
})();
