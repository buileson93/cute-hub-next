import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "admin" | "phong_kt" | "phu_trach_dv" | "ktv" | "readonly" | "quan_ly_du_an" | "to_truong";

export interface Profile {
  id: string;
  email: string;
  ho_ten: string | null;
  don_vi: string | null;
  active: boolean;
  avatar_url: string | null;
  tour_hoan_thanh: boolean;
}

interface AuthState {
  loading: boolean;
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  roles: AppRole[];
}

export function useSession(): AuthState & { hasRole: (r: AppRole) => boolean; refresh: () => void } {
  const [state, setState] = useState<AuthState>({
    loading: true, session: null, user: null, profile: null, roles: [],
  });
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function hydrate(session: Session | null) {
      if (!session?.user) {
        if (!cancelled) setState({ loading: false, session: null, user: null, profile: null, roles: [] });
        return;
      }
      const [profileRes, rolesRes] = await Promise.all([
        supabase.from("profiles").select("id,email,ho_ten,don_vi,active,avatar_url,tour_hoan_thanh").eq("id", session.user.id).maybeSingle(),
        supabase.from("user_roles").select("role").eq("user_id", session.user.id),
      ]);
      if (cancelled) return;
      setState({
        loading: false,
        session,
        user: session.user,
        profile: (profileRes.data as Profile | null) ?? null,
        roles: ((rolesRes.data ?? []) as { role: AppRole }[]).map((r) => r.role),
      });
    }

    supabase.auth.getSession().then(({ data }) => hydrate(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED" || event === "TOKEN_REFRESHED") {
        hydrate(session);
      }
    });
    return () => { cancelled = true; sub.subscription.unsubscribe(); };
  }, [tick]);

  return {
    ...state,
    hasRole: (r) => state.roles.includes(r),
    refresh: () => setTick((t) => t + 1),
  };
}
