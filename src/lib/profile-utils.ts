import type { Profile } from "@/types/profile";

export function getDisplayName(
  profile: Profile | null,
  email: string | undefined
): string {
  if (profile?.display_name?.trim()) return profile.display_name.trim();
  if (email) {
    const local = email.split("@")[0];
    if (local) return local;
  }
  return "Concert fan";
}

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
