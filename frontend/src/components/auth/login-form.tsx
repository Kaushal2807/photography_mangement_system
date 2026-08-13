"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { apiRequest } from "@/lib/api";

type LoginResponse = {
  success: boolean;
  message: string;
  accessToken: string;
  user: {
    id: string;
    name: string;
    email: string;
    mobile: string;
    role: string;
  };
};

type LoginFormProps = {
  initialIdentifier?: string;
};

export function LoginForm({ initialIdentifier = "" }: LoginFormProps) {
  const router = useRouter();
  const [identifier, setIdentifier] = useState(initialIdentifier);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setMessage(null);
    setError(null);

    try {
      const response = await apiRequest<LoginResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ identifier, password }),
      });

      localStorage.setItem("accessToken", response.accessToken);
      localStorage.setItem("user", JSON.stringify(response.user));
      setMessage(response.message);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to sign in.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
      {message ? (
        <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/10 p-4 text-sm text-emerald-300">
          {message}
        </div>
      ) : null}

      {error ? (
        <div className="rounded-2xl border border-rose-500/25 bg-rose-500/10 p-4 text-sm text-rose-300">
          {error}
        </div>
      ) : null}

      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-200" htmlFor="identifier">
          Email or Mobile
        </label>
        <Input
          id="identifier"
          className="h-11 border-white/15 bg-[#0a1330] text-white placeholder:text-slate-400 focus-visible:border-sky-400 focus-visible:ring-sky-400/25"
          value={identifier}
          onChange={(event) => setIdentifier(event.target.value)}
          placeholder="john@example.com or 9876543210"
          autoComplete="username"
          required
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-200" htmlFor="password">
          Password
        </label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            className="h-11 border-white/15 bg-[#0a1330] pr-11 text-white placeholder:text-slate-400 focus-visible:border-sky-400 focus-visible:ring-sky-400/25"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Enter your password"
            autoComplete="current-password"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword((current) => !current)}
            className="absolute inset-y-0 right-3 flex items-center text-slate-400 transition-colors hover:text-slate-200"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between text-sm">
        <span className="text-slate-400">Use the admin credentials created during setup.</span>
        <button type="button" className="font-medium text-sky-300 hover:text-sky-200">
          Forgot password
        </button>
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="inline-flex h-11 w-full items-center justify-center rounded-2xl bg-gradient-to-r from-[#2c6df7] via-[#19a9e6] to-[#2dd4bf] px-4 text-sm font-medium text-white shadow-[0_14px_40px_rgba(25,169,230,0.28)] transition-transform hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? "Signing in..." : "Login"}
      </button>
    </form>
  );
}
