import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface Props {
  name?: string | null;
  email?: string | null;
  url?: string | null;
  className?: string;
}

export function UserAvatar({ name, email, url, className }: Props) {
  const label = (typeof name === "string" ? name : (email ?? "?")).trim();
  const initials =
    label
      .split(/\s+/)
      .filter(Boolean)
      .slice(-2)
      .map((s) => s[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "?";
  return (
    <Avatar className={cn("h-9 w-9", className)}>
      {url ? <AvatarImage src={url} alt={label} /> : null}
      <AvatarFallback className="bg-[#0074e2]/10 text-[11px] font-semibold text-[#0074e2]">
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}
