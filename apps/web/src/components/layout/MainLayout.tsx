
import type { ReactNode } from "react";
import Navbar from "../Navbar";

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-blue-50/40">
      <Navbar />

      <main className="relative">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-24 -left-24 h-64 w-64 rounded-full bg-blue-200/25 blur-3xl" />
          <div className="absolute top-24 right-0 h-72 w-72 rounded-full bg-cyan-100/30 blur-3xl" />
        </div>

        <div className="relative mx-auto w-full max-w-7xl px-4 pb-8 pt-5 sm:px-6 sm:pt-6 lg:px-8 lg:pt-8">
          <section className="rounded-2xl border border-slate-200/70 bg-white/80 p-4 shadow-sm backdrop-blur-sm sm:p-6 lg:p-8">
            {children}
          </section>
        </div>
      </main>
    </div>
  );
}
