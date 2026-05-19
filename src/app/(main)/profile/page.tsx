import { redirect } from "next/navigation";
import { ProfileForm } from "@/components/ProfileForm";
import { fetchUserProfile, getDisplayName } from "@/lib/fetch-profile";
import { createClient } from "@/lib/supabase/server";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const profile = await fetchUserProfile(user.id);
  const displayName = getDisplayName(profile, user.email);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Your profile</h1>
      <p className="text-sm opacity-70 mb-6">
        Set a display name and photo for the top of the app instead of your email.
      </p>
      <ProfileForm
        userId={user.id}
        initialDisplayName={displayName}
        initialAvatarUrl={profile?.avatar_url ?? null}
        email={user.email ?? ""}
      />
    </div>
  );
}
