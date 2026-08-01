import Link from "next/link";
import { AuthForm } from "@/components/auth-form";

export default function AuthPage() {
  return (
    <main className="grid min-h-screen place-items-center px-6 py-16">
      <section className="w-full max-w-md rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
        <Link className="text-sm font-semibold text-emerald-700" href="/">
          ← Allah&apos;ın Şişkosu
        </Link>
        <h1 className="mt-6 text-3xl font-bold tracking-tight">Welcome</h1>
        <p className="mt-2 text-slate-600">
          Sign in or create an account to continue.
        </p>
        <div className="mt-8">
          <AuthForm />
        </div>
      </section>
    </main>
  );
}
