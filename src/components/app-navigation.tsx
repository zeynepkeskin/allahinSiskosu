"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navigationItems = [
  { href: "/dashboard", label: "Dashboard", symbol: "⌂" },
  { href: "/meals/new", label: "Add meal", symbol: "+" },
  { href: "/progress", label: "Progress", symbol: "↗" },
  { href: "/profile", label: "Profile", symbol: "○" },
] as const;

export function AppNavigation() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Main navigation"
      className="border-stone-200 bg-white lg:min-h-screen lg:w-60 lg:border-r"
    >
      <div className="flex h-full items-center justify-between gap-3 px-4 py-3 lg:flex-col lg:items-stretch lg:px-5 lg:py-7">
        <Link
          className="shrink-0 text-base font-bold tracking-tight text-stone-950 lg:px-3"
          href="/dashboard"
        >
          Allah&apos;ın <span className="text-emerald-600">Şişkosu</span>
        </Link>
        <div className="flex items-center gap-1 overflow-x-auto lg:mt-8 lg:flex-col lg:items-stretch">
          {navigationItems.map((item) => {
            const isCurrent = pathname === item.href;
            return (
              <Link
                aria-current={isCurrent ? "page" : undefined}
                className={`flex min-h-10 items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-colors ${isCurrent ? "bg-emerald-50 text-emerald-800" : "text-stone-600 hover:bg-stone-100 hover:text-stone-950"}`}
                href={item.href}
                key={item.href}
              >
                <span
                  aria-hidden="true"
                  className="grid size-5 place-items-center text-base leading-none"
                >
                  {item.symbol}
                </span>
                <span className="hidden sm:inline lg:inline">{item.label}</span>
              </Link>
            );
          })}
        </div>
        <p className="hidden border-t border-stone-100 px-3 pt-5 text-xs leading-5 text-stone-400 lg:block">
          Build small habits. They add up.
        </p>
      </div>
    </nav>
  );
}
