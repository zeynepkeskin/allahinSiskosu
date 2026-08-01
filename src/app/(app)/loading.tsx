import { Skeleton } from "@/components/ui";

export default function AppLoading() {
  return <div aria-label="Loading page" className="animate-pulse" role="status"><Skeleton className="h-4 w-24" /><Skeleton className="mt-3 h-9 w-64 max-w-full" /><Skeleton className="mt-3 h-5 w-96 max-w-full" /><div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 4 }, (_, index) => <Skeleton className="h-32" key={index} />)}</div><div className="mt-7 grid gap-6 lg:grid-cols-2"><Skeleton className="h-72" /><Skeleton className="h-72" /></div><span className="sr-only">Loading page content</span></div>;
}
