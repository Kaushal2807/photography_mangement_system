"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthFormCard } from "@/components/auth/auth-form-card";
import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";
import { API_BASE_URL } from "@/lib/api";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [setupCompleted, setSetupCompleted] = useState(false);
  const initialIdentifier = searchParams.get("identifier") ?? "";

  useEffect(() => {
    const checkSetupStatus = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/setup/status`);
        const data = await response.json();
        const completed = Boolean(data.isSetupCompleted);
        setSetupCompleted(completed);
        if (!completed) {
          router.replace("/");
        }
      } catch {
        setSetupCompleted(false);
      } finally {
        setLoading(false);
      }
    };

    void checkSetupStatus();
  }, [router]);

  return (
    <AuthShell
      eyebrow="Photography Studio Manager"
      title="Welcome back"
      description="Sign in with the admin account created during setup to continue into the studio dashboard."
    >
      <AuthFormCard
        title={loading ? "Checking installation state" : setupCompleted ? "Login" : "Redirecting"}
        description={
          loading
            ? "Preparing your secure login screen..."
            : setupCompleted
              ? "Use your email or mobile and password to continue."
              : "Setup is not completed yet."
        }
      >
        {setupCompleted ? (
          <>
            <div className="mb-5 rounded-2xl border border-sky-400/15 bg-sky-400/10 px-4 py-3 text-sm text-sky-100">
              Login to the administrator account created during setup.
            </div>
            <LoginForm initialIdentifier={initialIdentifier} />
          </>
        ) : (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
            Setup is not completed yet. You will be redirected back to the setup screen.
          </div>
        )}
      </AuthFormCard>
    </AuthShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center text-slate-400">Loading...</div>}>
      <LoginContent />
    </Suspense>
  );
}
