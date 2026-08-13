import type { ReactNode } from "react";

type AuthFormCardProps = {
  title: string;
  description: string;
  children: ReactNode;
};

export function AuthFormCard({ title, description, children }: AuthFormCardProps) {
  return (
    <section className="w-full max-w-xl rounded-[1.5rem] border border-white/10 bg-slate-950/80 shadow-[0_24px_120px_rgba(0,0,0,0.55)] backdrop-blur-xl">
      <header className="border-b border-white/8 bg-white/5 px-6 py-5">
        <p className="text-xl font-semibold text-white">{title}</p>
        <p className="mt-1 text-sm text-slate-300">{description}</p>
      </header>
      <div className="p-6">{children}</div>
    </section>
  );
}
