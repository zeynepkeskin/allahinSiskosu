"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const links = [
  { href: "/dashboard", label: "Dashboard", icon: "⌂" },
  { href: "/meals", label: "Meals", icon: "☷" },
  { href: "/recommendations", label: "Recommendations", icon: "✦" },
  { href: "/analytics", label: "Analytics", icon: "≋" },
  { href: "/progress", label: "Progress", icon: "↗" },
  { href: "/profile", label: "Profile", icon: "◎" },
  { href: "/settings", label: "Settings", icon: "⚙" },
];

export function AppSidebar({ email }: { email?: string }) {
  const pathname = usePathname();
  async function signOut() { await createClient().auth.signOut(); window.location.assign("/"); }
  return <aside className="flex w-full shrink-0 flex-col border-b border-slate-200 bg-white lg:min-h-screen lg:w-64 lg:border-r lg:border-b-0"><div className="flex items-center justify-between px-5 py-5 lg:px-6"><Link className="text-lg font-bold tracking-tight text-slate-900" href="/dashboard">Fit<span className="text-emerald-600">log</span></Link><span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">Beta</span></div><nav aria-label="Main navigation" className="flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-col lg:px-4">{links.map((link) => { const active = pathname === link.href || pathname.startsWith(`${link.href}/`); return <Link className={`flex shrink-0 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${active ? "bg-emerald-50 text-emerald-700" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`} href={link.href} key={link.href}><span aria-hidden="true" className="grid h-5 w-5 place-items-center text-base">{link.icon}</span>{link.label}</Link>; })}</nav><div className="mt-auto hidden border-t border-slate-100 p-4 lg:block"><p className="truncate px-3 text-sm font-medium text-slate-700">{email ?? "Your account"}</p><button className="mt-2 w-full rounded-xl px-3 py-2 text-left text-sm font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-900" onClick={signOut} type="button">Sign out</button></div></aside>;
}
