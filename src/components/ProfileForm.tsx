"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getInitials } from "@/lib/profile-utils";
import { FormField } from "@/components/FormField";

type ProfileFormProps = {
  userId: string;
  initialDisplayName: string;
  initialAvatarUrl: string | null;
  email: string;
};

const MAX_BYTES = 2 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export function ProfileForm({
  userId,
  initialDisplayName,
  initialAvatarUrl,
  email,
}: ProfileFormProps) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(
    null
  );

  const shownAvatar = previewUrl ?? avatarUrl;
  const initials = getInitials(displayName || email);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      setMessage({ type: "error", text: "Please choose a JPG, PNG, WebP, or GIF image." });
      return;
    }
    if (file.size > MAX_BYTES) {
      setMessage({ type: "error", text: "Image must be 2 MB or smaller." });
      return;
    }

    setMessage(null);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const supabase = createClient();
    let newAvatarUrl = avatarUrl;

    const file = fileRef.current?.files?.[0];
    if (file) {
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${userId}/avatar.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true, contentType: file.type });

      if (uploadError) {
        setLoading(false);
        setMessage({ type: "error", text: uploadError.message });
        return;
      }

      const { data: publicData } = supabase.storage.from("avatars").getPublicUrl(path);
      newAvatarUrl = `${publicData.publicUrl}?t=${Date.now()}`;
    }

    const trimmed = displayName.trim();
    const { error: profileError } = await supabase.from("profiles").upsert({
      id: userId,
      display_name: trimmed || null,
      avatar_url: newAvatarUrl,
      updated_at: new Date().toISOString(),
    });

    setLoading(false);

    if (profileError) {
      setMessage({ type: "error", text: profileError.message });
      return;
    }

    setAvatarUrl(newAvatarUrl);
    setPreviewUrl(null);
    if (fileRef.current) fileRef.current.value = "";
    setMessage({ type: "success", text: "Profile saved! Your header will update now." });
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="card bg-base-100 shadow max-w-lg">
      <div className="card-body gap-5">
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="avatar">
            <div className="w-24 h-24 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
              {shownAvatar ? (
                <img src={shownAvatar} alt="" className="object-cover" />
              ) : (
                <div className="flex items-center justify-center w-full h-full bg-primary text-primary-content text-2xl font-bold">
                  {initials}
                </div>
              )}
            </div>
          </div>
          <div className="flex-1 w-full space-y-2">
            <label className="btn btn-outline btn-sm w-full" htmlFor="avatar-upload">
              Choose photo
            </label>
            <input
              id="avatar-upload"
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={handleFileChange}
            />
            <p className="text-xs opacity-60">JPG, PNG, WebP, or GIF · max 2 MB</p>
          </div>
        </div>

        {message ? (
          <div
            role="alert"
            className={`alert text-sm ${message.type === "error" ? "alert-error" : "alert-success"}`}
          >
            <span>{message.text}</span>
          </div>
        ) : null}

        <FormField label="Display name" htmlFor="display_name" helper="Shown at the top of the app">
          <input
            id="display_name"
            className="input input-bordered w-full"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Your name"
            maxLength={60}
          />
        </FormField>

        <p className="text-xs opacity-60">
          Signed in as {email}. Your email is only used for login, not shown in the header.
        </p>

        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? <span className="loading loading-spinner" /> : "Save profile"}
        </button>
      </div>
    </form>
  );
}


