import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/backend/client";

export type AppRole =
  | "admin"
  | "phong_kt"
  | "phu_trach_dv"
  | "ktv"
  | "readonly"
  | "quan_ly_du_an"
  | "to_truong";

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

const INITIAL: AuthState = {
  loading: true,
  session: null,
  user: null,
  profile: null,
  roles: [],
};

/**
 * Store phiên đăng nhập dùng chung (singleton).
 *
 * Trước đây mỗi component gọi `useSession()` sẽ tự chạy `getSession()` +
 * truy vấn `profiles`/`user_roles` riêng → trùng lặp hàng chục request và
 * dễ kẹt ở trạng thái loading khi effect bị huỷ giữa chừng (StrictMode).
 * Nay chỉ có một tiến trình hydrate duy nhất, các component chỉ subscribe.
 */
let state: AuthState = INITIAL;
const listeners = new Set<(s: AuthState) => void>();
let initialized = false;
let hydrateSeq = 0;

function setState(next: AuthState) {
  state = next;
  listeners.forEach((l) => l(next));
}

async function hydrate(session: Session | null) {
  const seq = ++hydrateSeq;
  if (!session?.user) {
    setState({ loading: false, session: null, user: null, profile: null, roles: [] });
    return;
  }
  // Vừa đăng nhập xong: phải công bố NGAY trạng thái "đang tải" kèm phiên mới.
  // Nếu không, store vẫn còn {loading:false, session:null} trong lúc tải hồ sơ
  // → route bảo vệ tưởng người dùng chưa đăng nhập và đá ngược về /auth
  // (đúng triệu chứng: giật màn hình, phải F5 mới vào được).
  if (state.session?.user?.id !== session.user.id) {
    setState({ loading: true, session, user: session.user, profile: null, roles: [] });
  }
  try {
    const [profileRes, rolesRes] = await Promise.all([
      supabase
        .from("profiles")
        .select("id,email,ho_ten,don_vi,active,avatar_url,tour_hoan_thanh")
        .eq("id", session.user.id)
        .maybeSingle(),
      supabase.from("user_roles").select("role").eq("user_id", session.user.id),
    ]);
    if (seq !== hydrateSeq) return; // đã có lần hydrate mới hơn
    setState({
      loading: false,
      session,
      user: session.user,
      profile: (profileRes.data as Profile | null) ?? null,
      roles: ((rolesRes.data ?? []) as { role: AppRole }[]).map((r) => r.role),
    });
  } catch {
    if (seq !== hydrateSeq) return;
    // Vẫn thoát khỏi trạng thái loading để UI hiển thị được (fail-soft).
    setState({ loading: false, session, user: session.user, profile: null, roles: [] });
  }
}

function init() {
  if (initialized || typeof window === "undefined") return;
  initialized = true;
  supabase.auth.getSession().then(({ data }) => hydrate(data.session));
  supabase.auth.onAuthStateChange((event, session) => {
    if (
      event === "SIGNED_IN" ||
      event === "SIGNED_OUT" ||
      event === "USER_UPDATED" ||
      event === "TOKEN_REFRESHED"
    ) {
      hydrate(session);
    }
  });
}

export function useSession(): AuthState & {
  hasRole: (r: AppRole) => boolean;
  refresh: () => void;
} {
  const [local, setLocal] = useState<AuthState>(state);

  useEffect(() => {
    init();
    listeners.add(setLocal);
    setLocal(state);
    return () => {
      listeners.delete(setLocal);
    };
  }, []);

  return {
    ...local,
    hasRole: (r) => local.roles.includes(r),
    refresh: () => {
      void supabase.auth.getSession().then(({ data }) => hydrate(data.session));
    },
  };
}
