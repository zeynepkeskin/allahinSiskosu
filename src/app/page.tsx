import Link from "next/link";

export default function Home() {
  return (
    <main className="flex flex-1 items-center justify-center bg-slate-50 px-6 py-16">
      <section className="w-full max-w-xl rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-200 sm:p-12">
        <p className="text-sm font-semibold tracking-wide text-emerald-600 uppercase">
          Allahın Şişkosu
        </p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight text-slate-950">
          Nutrition tracking, made simpler.
        </h1>
        <p className="mt-4 text-lg leading-8 text-slate-600">
          Sign in to start tracking meals, calories, and progress.
        </p>
        <Link className="mt-8 inline-flex rounded-full bg-emerald-600 px-5 py-3 font-semibold text-white transition-colors hover:bg-emerald-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600" href="/auth">
          Sign in
        </Link>
      </section>
    </main>
  );
}
