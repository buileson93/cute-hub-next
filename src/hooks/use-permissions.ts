import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getMyPermissions } from "@/lib/rbac.functions";

export type MyPerms = {
  roles: string[];
  permissions: Record<string, string[]>;
  scope: Array<{ to_chuc_id: string | null; don_vi_id: string | null }>;
  isGlobal: boolean;
};

export function useMyPermissions() {
  const fn = useServerFn(getMyPermissions);
  return useQuery<MyPerms>({
    queryKey: ["rbac", "my-perms"],
    queryFn: () => fn() as any,
    staleTime: 60_000,
  });
}

export function useCan(module: string | string[], action: string): boolean {
  const { data } = useMyPermissions();
  if (!data) return false;
  if (data.roles.includes("admin")) return true;

  const modules = Array.isArray(module) ? module : [module];
  return modules.some((m) => data.permissions[m]?.includes(action));
}
