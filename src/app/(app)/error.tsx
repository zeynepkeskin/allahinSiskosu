"use client";

import { useEffect } from "react";
import { Button, Card } from "@/components/ui";

export default function AppError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { document.title = "Something went wrong | Fitlog"; }, []);
  return <Card className="mx-auto mt-16 max-w-lg text-center"><p className="text-sm font-semibold text-rose-600">SOMETHING WENT WRONG</p><h1 className="mt-2 text-2xl font-bold">We couldn’t load this page.</h1><p className="mt-3 text-sm leading-6 text-slate-500">Please try again. If the problem continues, return to the dashboard and try later.</p><Button className="mt-6" onClick={reset} type="button">Try again</Button></Card>;
}
