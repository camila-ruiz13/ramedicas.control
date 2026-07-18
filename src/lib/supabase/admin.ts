import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// service_role bypasses Row Level Security — only import this from server
// actions/route handlers that have already verified the caller is an admin.
// The `server-only` import makes accidentally importing this from a Client
// Component a build error instead of a leaked secret.
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}
