import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface Props {
  name?: string | null;
  email?: string | null;
  url?: string | null;
  className?: string;
}

export function UserAvatar({ name, email, url, className }: Props) {
  const label = (typeof name === 'string' ? name : (email ?? "?")).trim();
  const initials = label
    .split(/\s+/)
    .filter(Boolean)
    .slice(-2)
    .map((s) => s[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "?";
  return (
    <Avatar size="sm" className={className}>
      {url ? <AvatarImage src={url} alt={label} /> : null}
      <AvatarFallback>
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}
