import { LoginForm } from "@/components/LoginForm";
import { ThemeSelector } from "@/components/ThemeSelector";

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/20 via-base-200 to-secondary/20">
      <div className="hero min-h-screen">
        <div className="hero-content flex-col lg:flex-row-reverse gap-10 w-full max-w-5xl px-4 py-10">
          <div className="text-center lg:text-left flex-1">
            <div className="flex justify-center lg:justify-end mb-4">
              <ThemeSelector />
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Concert Cost Tracker
            </h1>
            <p className="py-4 text-lg opacity-90 max-w-md mx-auto lg:mx-0">
              Remember every show. See what you spent, how long you were there, and
              whether the night was worth it — all in one friendly place.
            </p>
            <ul className="text-sm space-y-2 opacity-80 max-w-sm mx-auto lg:mx-0 text-left list-disc list-inside">
              <li>Log tickets, travel, food, merch, and more</li>
              <li>Rate the fun from 1 to 10</li>
              <li>Charts and stats that update as you go</li>
            </ul>
          </div>
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
