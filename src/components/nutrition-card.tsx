type NutritionCardProps = {
  label: string;
  value: string;
  detail: string;
  color: "emerald" | "amber" | "rose";
};
const colorClasses = {
  emerald: "bg-emerald-500",
  amber: "bg-amber-400",
  rose: "bg-rose-400",
};
export function NutritionCard({
  label,
  value,
  detail,
  color,
}: NutritionCardProps) {
  return (
    <article className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-stone-600">{label}</p>
        <span
          aria-hidden="true"
          className={`size-2.5 rounded-full ${colorClasses[color]}`}
        />
      </div>
      <p className="mt-4 text-2xl font-bold tracking-tight text-stone-950">
        {value}
      </p>
      <p className="mt-1 text-sm text-stone-500">{detail}</p>
    </article>
  );
}
