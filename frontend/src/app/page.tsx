"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

type FormData = {
  studioName: string;
  ownerName: string;
  mobile: string;
  email: string;
  password: string;
  confirmPassword: string;
};

const initialForm: FormData = {
  studioName: "",
  ownerName: "",
  mobile: "",
  email: "",
  password: "",
  confirmPassword: "",
};

const setupHighlights = [
  "Single-studio installation guard",
  "First admin account creation",
  "Studio profile and invoice prefix setup",
  "Production-ready validation and security",
];

const blueprintMetrics = [
  { label: "Setup Flow", value: "01 / 01" },
  { label: "Primary Mode", value: "Install" },
  { label: "Security", value: "bcrypt" },
  { label: "Database", value: "PostgreSQL" },
];

export default function Home() {
  const router = useRouter();
  const [formData, setFormData] = useState<FormData>(initialForm);
  const [isSetupCompleted, setIsSetupCompleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkSetupStatus = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/setup/status`);
        const data = await response.json();
        setIsSetupCompleted(Boolean(data.isSetupCompleted));
      } catch (err) {
        setError("Unable to reach the backend server. Please make sure it is running on port 3000.");
      } finally {
        setLoading(false);
      }
    };

    void checkSetupStatus();
  }, []);

  useEffect(() => {
    if (!loading && isSetupCompleted) {
      router.replace("/login");
    }
  }, [loading, isSetupCompleted, router]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setMessage(null);

    if (formData.password !== formData.confirmPassword) {
      setError("Password and confirm password must match.");
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch(`${API_BASE_URL}/setup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message ?? "Setup failed");
      }

      setMessage(data.message ?? "Studio setup completed successfully.");
      setIsSetupCompleted(true);
      setFormData(initialForm);
      router.push(`/login?identifier=${encodeURIComponent(formData.email.trim())}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to complete setup.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen overflow-hidden bg-[#030818] text-slate-100">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.22),transparent_32%),radial-gradient(circle_at_top_right,rgba(14,165,233,0.18),transparent_28%),linear-gradient(180deg,#040816_0%,#02040b_100%)]" />
      <div className="relative mx-auto flex min-h-screen w-full max-w-5xl flex-col px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <div className="mb-6 rounded-[1.75rem] border border-white/10 bg-white/5 px-5 py-4 shadow-[0_24px_120px_rgba(0,0,0,0.45)] backdrop-blur-xl">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-[0.65rem] font-semibold uppercase tracking-[0.55em] text-sky-300/90">
                Photography Studio Manager
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl [font-family:var(--font-geist-sans),Georgia,serif]">
                {isSetupCompleted ? "Studio setup is complete" : "Complete your studio setup"}
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
                {isSetupCompleted
                  ? "Your studio is already configured. You can now continue using the system."
                  : "A first-run installation screen for one studio, one owner, and a secure production-ready launch."}
              </p>
            </div>

            <div className="rounded-2xl border border-sky-400/20 bg-sky-400/10 px-4 py-3 text-right">
              <p className="text-[0.62rem] uppercase tracking-[0.45em] text-sky-300">Mode</p>
              <p className="mt-1 text-lg font-semibold text-white">
                {loading ? "Checking" : isSetupCompleted ? "Completed" : "Install"}
              </p>
            </div>
          </div>
        </div>

        <section className="mx-auto w-full max-w-4xl">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {blueprintMetrics.map((metric) => (
              <div
                key={metric.label}
                className="rounded-2xl border border-white/8 bg-slate-950/60 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]"
              >
                <p className="text-[0.68rem] uppercase tracking-[0.35em] text-slate-400">
                  {metric.label}
                </p>
                <p className="mt-2 text-lg font-semibold text-white">{metric.value}</p>
              </div>
            ))}
          </div>

          <Card className="mt-6 border-white/10 bg-slate-950/80 shadow-[0_24px_120px_rgba(0,0,0,0.55)] backdrop-blur-xl">
            <CardHeader className="border-b border-white/8 bg-white/5">
              <CardTitle className="text-xl text-white">Studio Setup</CardTitle>
              <CardDescription className="text-slate-300">
                {loading
                  ? "Checking setup status..."
                  : isSetupCompleted
                    ? "The setup process has already been completed."
                    : "Fill in the details below to create your studio and admin user."}
              </CardDescription>
            </CardHeader>

            <CardContent className="p-6">
              {message ? (
                <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/10 p-4 text-sm text-emerald-300">
                  {message}
                </div>
              ) : null}

              {error ? (
                <div className="mt-4 rounded-2xl border border-rose-500/25 bg-rose-500/10 p-4 text-sm text-rose-300">
                  {error}
                </div>
              ) : null}

              {!isSetupCompleted ? (
                <form className="mt-6 grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium text-slate-200" htmlFor="studioName">
                      Studio Name
                    </label>
                    <Input
                      id="studioName"
                      className="border-white/15 bg-[#0a1330] text-white placeholder:text-slate-400 focus-visible:border-sky-400 focus-visible:ring-sky-400/25"
                      value={formData.studioName}
                      onChange={(event) =>
                        setFormData((current) => ({ ...current, studioName: event.target.value }))
                      }
                      placeholder="ABC Studio"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-200" htmlFor="ownerName">
                      Owner Name
                    </label>
                    <Input
                      id="ownerName"
                      className="border-white/15 bg-[#0a1330] text-white placeholder:text-slate-400 focus-visible:border-sky-400 focus-visible:ring-sky-400/25"
                      value={formData.ownerName}
                      onChange={(event) =>
                        setFormData((current) => ({ ...current, ownerName: event.target.value }))
                      }
                      placeholder="John Doe"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-200" htmlFor="mobile">
                      Mobile
                    </label>
                    <Input
                      id="mobile"
                      className="border-white/15 bg-[#0a1330] text-white placeholder:text-slate-400 focus-visible:border-sky-400 focus-visible:ring-sky-400/25"
                      value={formData.mobile}
                      onChange={(event) =>
                        setFormData((current) => ({ ...current, mobile: event.target.value }))
                      }
                      placeholder="9876543210"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-200" htmlFor="email">
                      Email
                    </label>
                    <Input
                      id="email"
                      type="email"
                      className="border-white/15 bg-[#0a1330] text-white placeholder:text-slate-400 focus-visible:border-sky-400 focus-visible:ring-sky-400/25"
                      value={formData.email}
                      onChange={(event) =>
                        setFormData((current) => ({ ...current, email: event.target.value }))
                      }
                      placeholder="john@example.com"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-200" htmlFor="password">
                      Password
                    </label>
                    <Input
                      id="password"
                      type="password"
                      className="border-white/15 bg-[#0a1330] text-white placeholder:text-slate-400 focus-visible:border-sky-400 focus-visible:ring-sky-400/25"
                      value={formData.password}
                      onChange={(event) =>
                        setFormData((current) => ({ ...current, password: event.target.value }))
                      }
                      placeholder="Minimum 6 characters"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-200" htmlFor="confirmPassword">
                      Confirm Password
                    </label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      className="border-white/15 bg-[#0a1330] text-white placeholder:text-slate-400 focus-visible:border-sky-400 focus-visible:ring-sky-400/25"
                      value={formData.confirmPassword}
                      onChange={(event) =>
                        setFormData((current) => ({
                          ...current,
                          confirmPassword: event.target.value,
                        }))
                      }
                      placeholder="Re-enter password"
                      required
                    />
                  </div>

                  <div className="md:col-span-2">
                    <Button
                      type="submit"
                      className="h-11 w-full rounded-2xl bg-gradient-to-r from-[#2c6df7] via-[#19a9e6] to-[#2dd4bf] text-white shadow-[0_14px_40px_rgba(25,169,230,0.28)] transition-transform hover:scale-[1.01]"
                      disabled={submitting}
                    >
                      {submitting ? "Setting up studio..." : "Create Studio"}
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-6 text-sm text-slate-300">
                  Your studio is ready. Use the application dashboard to continue with meetings,
                  bookings, editing, invoices, reports, and settings.
                </div>
              )}
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
}
