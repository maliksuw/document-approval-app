const SUPABASE_URL = "https://niouqddvxpaoztwyetkr.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_4YUqveKhfWgf1J4WqIKu1g_myrvOeDI";

const sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function requireSession() {
  const { data: { session } } = await sb.auth.getSession();
  if (!session) {
    window.location.href = "login.html";
    return null;
  }
  return session;
}

async function loadProfile(userId) {
  const { data, error } = await sb
    .from("profiles")
    .select("id, full_name, role")
    .eq("id", userId)
    .single();
  if (error) throw error;
  return data;
}
