import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const OWNER_EMAIL = "ritesshhh19@gmail.com";

/**
 * Owner bootstrap: grants the admin role to the authorised owner account only.
 * Runs entirely on the server so no privileged function is exposed to clients.
 */
export const ensureAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const email = String(
      (context.claims as { email?: string } | undefined)?.email ?? "",
    ).toLowerCase();
    if (email !== OWNER_EMAIL) return { isAdmin: false };

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin
      .from("user_roles")
      .upsert({ user_id: context.userId, role: "admin" }, { onConflict: "user_id,role" });
    return { isAdmin: true };
  });
