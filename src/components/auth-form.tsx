"use client";

import { useState, type FormEvent } from "react";

import { createClient } from "@/lib/supabase/client";

type AuthMode = "signIn" | "signUp";

export function AuthForm() {
  const [mode, setMode] = useState<AuthMode>("signIn");
  const [message, setMessage] = useState<string>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage(undefined);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");
    const supabase = createClient();
    const result = mode === "signIn"
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password, options: { emailRedirectTo: `${window.location.origin}/auth/callback` } });

    setIsSubmitting(false);

    if (result.error) {
      setMessage(result.error.message);
      return;
    }

    if (mode === "signIn") {
      window.location.assign("/");
      return;
    }

    setMessage("Check your email to confirm your account, then sign in.");
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <div>
        <label className="text-sm font-medium text-slate-700" htmlFor="email">Email</label>
        <input className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" id="email" name="email" required type="email" />
      </div>
      <div>
        <label className="text-sm font-medium text-slate-700" htmlFor="password">Password</label>
        <input className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" id="password" minLength={6} name="password" required type="password" />
      </div>
      {message ? <p aria-live="polite" className="text-sm text-slate-600">{message}</p> : null}
      <button className="w-full rounded-lg bg-emerald-600 px-4 py-2 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60" disabled={isSubmitting} type="submit">
        {isSubmitting ? "Please wait…" : mode === "signIn" ? "Sign in" : "Create account"}
      </button>
      <button className="w-full text-sm font-medium text-emerald-700" onClick={() => { setMode(mode === "signIn" ? "signUp" : "signIn"); setMessage(undefined); }} type="button">
        {mode === "signIn" ? "Need an account? Sign up" : "Already have an account? Sign in"}
      </button>
    </form>
  );
}
