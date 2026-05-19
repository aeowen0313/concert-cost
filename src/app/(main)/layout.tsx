import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { fetchUserProfile, getDisplayName } from "@/lib/fetch-profile";
import { createClient } from "@/lib/supabase/server";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const profile = await fetchUserProfile(user.id);
  const displayName = getDisplayName(profile, user.email);

  return (
    <AppShell
      displayName={displayName}
      avatarUrl={profile?.avatar_url ?? null}
    >
      {children}
    </AppShell>
  );
}
