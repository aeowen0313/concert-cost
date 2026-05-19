import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/types/profile";

export { getDisplayName, getInitials } from "@/lib/profile-utils";

export async function fetchUserProfile(userId: string): Promise<Profile | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    console.error("Failed to load profile:", error.message);
    return null;
  }

  if (data) return data as Profile;

  const { data: created, error: insertError } = await supabase
    .from("profiles")
    .insert({ id: userId })
    .select()
    .single();

  if (insertError) {
    console.error("Failed to create profile:", insertError.message);
    return null;
  }

  return created as Profile;
}
