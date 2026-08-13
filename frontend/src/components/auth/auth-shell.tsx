import type { ReactNode } from "react";

type AuthShellProps = {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
};

export function AuthShell({ eyebrow, title, description, children }: AuthShellProps) {
  return (
    <main className="min-h-screen overflow-hidden bg-[#030818] text-slate-100">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.22),transparent_32%),radial-gradient(circle_at_top_right,rgba(14,165,233,0.18),transparent_28%),linear-gradient(180deg,#040816_0%,#02040b_100%)]" />
      <div className="relative mx-auto flex min-h-screen w-full max-w-5xl items-center px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <div className="w-full rounded-[1.75rem] border border-white/10 bg-white/5 px-5 py-6 shadow-[0_24px_120px_rgba(0,0,0,0.45)] backdrop-blur-xl sm:px-8 sm:py-8">
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.55em] text-sky-300/90">
            {eyebrow}
          </p>
          <div className="mt-3 flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-2xl">
              <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl [font-family:var(--font-geist-sans),Georgia,serif]">
                {title}
              </h1>
              <p className="mt-3 text-sm leading-7 text-slate-300 sm:text-base">{description}</p>
            </div>
            {children}
          </div>
        </div>
      </div>
    </main>
  );
}
