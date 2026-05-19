"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getInitials } from "@/lib/profile-utils";
import { ThemeSelector } from "@/components/ThemeSelector";

const NAV = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/add", label: "Add Concert" },
  { href: "/concerts", label: "My Concerts" },
  { href: "/recommendations", label: "Artist Recommendations" },
];

type AppShellProps = {
  displayName: string;
  avatarUrl: string | null;
  children: React.ReactNode;
};

export function AppShell({ displayName, avatarUrl, children }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const initials = getInitials(displayName);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-base-200">
      <header className="navbar bg-base-100 shadow-md px-4 lg:px-8">
        <div className="flex-1 flex-col items-start gap-0 sm:flex-row sm:items-center">
          <Link href="/dashboard" className="text-xl font-bold">
            Concert Cost Tracker
          </Link>
          <p className="text-xs opacity-70 hidden sm:block sm:ml-4">
            Track what you spend and how much fun you had
          </p>
        </div>
        <div className="flex-none gap-2 items-center flex-wrap justify-end">
          <Link
            href="/profile"
            className={`flex items-center gap-2 rounded-full pr-2 hover:bg-base-200 transition ${
              pathname === "/profile" ? "bg-base-200 ring-2 ring-primary" : ""
            }`}
            title="Edit profile"
          >
            <div className="avatar placeholder">
              <div className="w-9 rounded-full bg-primary text-primary-content">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="" className="object-cover" />
                ) : (
                  <span className="text-sm font-semibold">{initials}</span>
                )}
              </div>
            </div>
            <span className="text-sm font-medium max-w-[8rem] sm:max-w-[12rem] truncate">
              {displayName}
            </span>
          </Link>
          <ThemeSelector className="hidden md:block" />
          <button type="button" className="btn btn-ghost btn-sm" onClick={handleLogout}>
            Log out
          </button>
        </div>
      </header>

      <div className="bg-base-100 border-b border-base-300 px-4 lg:px-8 py-3 md:hidden">
        <ThemeSelector />
      </div>

      <nav className="tabs tabs-boxed bg-base-100 mx-4 lg:mx-8 mt-4 max-w-5xl flex-wrap">
        {NAV.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className={`tab flex-1 sm:flex-none ${pathname === href ? "tab-active" : ""}`}
          >
            {label}
          </Link>
        ))}
      </nav>

      <main className="px-4 lg:px-8 py-6 max-w-6xl mx-auto w-full">{children}</main>
    </div>
  );
}

