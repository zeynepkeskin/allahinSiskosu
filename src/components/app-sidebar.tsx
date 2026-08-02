"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const links = [
  { href: "/dashboard", label: "Dashboard", icon: "⌂" },
  { href: "/meals", label: "Meals", icon: "☷" },
  { href: "/exercises", label: "Exercises", icon: "🏋" },
  { href: "/recommendations", label: "Recommendations", icon: "✦" },
  { href: "/coach", label: "Coach", icon: "✨" },
  { href: "/analytics", label: "Analytics", icon: "≋" },
  { href: "/progress", label: "Progress", icon: "↗" },
  { href: "/profile", label: "Profile", icon: "◎" },
  { href: "/settings", label: "Settings", icon: "⚙" },
];

type NavigationProps = {
  close?: () => void;
  pathname: string;
};

function Navigation({ close, pathname }: NavigationProps) {
  return (
    <nav aria-label="Main navigation" className="flex flex-col gap-1 px-4 py-4">
      {links.map((link) => {
        const active = pathname === link.href || pathname.startsWith(`${link.href}/`);

        return (
          <Link
            aria-current={active ? "page" : undefined}
            className={`sidebar-link flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
              active
                ? "sidebar-link-active bg-emerald-50 text-emerald-700"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            }`}
            href={link.href}
            key={link.href}
            onClick={close}
          >
            <span aria-hidden="true" className="grid h-5 w-5 place-items-center text-base">
              {link.icon}
            </span>
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}

function Brand() {
  return (
    <Link className="text-lg font-bold tracking-tight text-slate-900" href="/dashboard">
      Fit<span className="text-emerald-600">log</span>
    </Link>
  );
}

export function AppSidebar({ email }: { email?: string }) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };

    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) menuButtonRef.current?.focus();
  }, [isOpen]);

  async function signOut() {
    await createClient().auth.signOut();
    window.location.assign("/");
  }

  return (
    <>
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4 lg:hidden">
        <Brand />
        <button
          aria-controls="mobile-navigation-drawer"
          aria-expanded={isOpen}
          aria-label="Open navigation menu"
          className="grid h-10 w-10 place-items-center rounded-xl text-slate-700 hover:bg-slate-50"
          onClick={() => setIsOpen(true)}
          ref={menuButtonRef}
          type="button"
        >
          <span aria-hidden="true" className="text-xl leading-none">☰</span>
        </button>
      </header>

      {isOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            aria-label="Close navigation menu"
            className="absolute inset-0 bg-slate-950/40"
            onClick={() => setIsOpen(false)}
            type="button"
          />
          <aside
            aria-label="Navigation drawer"
            aria-modal="true"
            className="relative flex h-full w-72 max-w-[85vw] flex-col bg-white shadow-2xl"
            id="mobile-navigation-drawer"
            role="dialog"
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <Brand />
              <button
                aria-label="Close navigation menu"
                className="grid h-10 w-10 place-items-center rounded-xl text-slate-700 hover:bg-slate-50"
                onClick={() => setIsOpen(false)}
                type="button"
              >
                <span aria-hidden="true" className="text-2xl leading-none">×</span>
              </button>
            </div>
            <Navigation close={() => setIsOpen(false)} pathname={pathname} />
            <div className="mt-auto border-t border-slate-100 p-4">
              <p className="truncate px-3 text-sm font-medium text-slate-700">{email ?? "Your account"}</p>
              <button className="mt-2 w-full rounded-xl px-3 py-2 text-left text-sm font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-900" onClick={signOut} type="button">
                Sign out
              </button>
            </div>
          </aside>
        </div>
      )}

      <aside className="hidden min-h-screen w-64 shrink-0 flex-col border-r border-slate-200 bg-white lg:flex">
        <div className="flex items-center justify-between px-6 py-5">
          <Brand />
          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">Beta</span>
        </div>
        <Navigation pathname={pathname} />
        <div className="mt-auto border-t border-slate-100 p-4">
          <p className="truncate px-3 text-sm font-medium text-slate-700">{email ?? "Your account"}</p>
          <button className="mt-2 w-full rounded-xl px-3 py-2 text-left text-sm font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-900" onClick={signOut} type="button">
            Sign out
          </button>
        </div>
      </aside>
    </>
  );
}
