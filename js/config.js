// =====================================================
// CONFIG — Plant Pulse / INDUS
// Supabase : oobbpbzujlgvmjxxpngc
// =====================================================
const SESSION_KEY = "indus_session";

const SUPABASE_URL = 'https://oobbpbzujlgvmjxxpngc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vYmJwYnp1amxndm1qeHhwbmdjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkyMjUwMDEsImV4cCI6MjEwNDgwMTAwMX0.DkzTZFHJBsqzxf3UwwUFSIGF3SyAs_Ouh044Eiy8Cr4';

// Client Supabase (chargé via CDN dans les pages HTML)
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
