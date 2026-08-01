"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { calculateProfileGoals } from "@/lib/calculations";
import { createClient } from "@/lib/supabase/client";
import { inchesToCentimeters, poundsToKilograms } from "@/lib/units";
import { Button, Card } from "@/components/ui";

const schema = z.object({
  heightIn: z.number().min(32, "Enter a valid height.").max(110),
  weightLb: z.number().min(55, "Enter a valid weight.").max(1100),
  targetWeight: z.number().min(55, "Enter a valid target.").max(1100),
  birthday: z
    .string()
    .date("Enter your birthday.")
    .refine(
      (v) => new Date(`${v}T00:00:00`) < new Date(),
      "Enter a past date.",
    ),
  gender: z.enum(["female", "male", "non_binary", "prefer_not_to_say"]),
  activityLevel: z.enum([
    "sedentary",
    "lightly_active",
    "moderately_active",
    "very_active",
    "extra_active",
  ]),
  goal: z.enum(["lose", "maintain", "gain"]),
});
type FormValues = z.infer<typeof schema>;
type Profile = Partial<FormValues>;
const choices = {
  gender: [
    ["female", "Female"],
    ["male", "Male"],
    ["non_binary", "Non-binary"],
    ["prefer_not_to_say", "Prefer not to say"],
  ],
  activityLevel: [
    ["sedentary", "Sedentary — little exercise"],
    ["lightly_active", "Lightly active — 1–3 days/week"],
    ["moderately_active", "Moderately active — 3–5 days/week"],
    ["very_active", "Very active — 6–7 days/week"],
    ["extra_active", "Extra active — physical job or training"],
  ],
  goal: [
    ["lose", "Lose weight"],
    ["maintain", "Maintain weight"],
    ["gain", "Gain weight"],
  ],
} as const;

export function ProfileForm({ profile }: { profile: Profile }) {
  const [message, setMessage] = useState<string>();
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: profile,
  });
  const values = useWatch({ control: form.control });
  const calculations = useMemo(() => {
    const parsed = schema.safeParse(values);
    return parsed.success ? calculateProfileGoals(parsed.data) : undefined;
  }, [values]);
  async function submit(data: FormValues) {
    setMessage(undefined);
    const goals = calculateProfileGoals(data);
    const supabase = createClient();
    const { data: auth, error: authError } = await supabase.auth.getUser();
    if (authError || !auth.user) {
      setMessage("Your session has expired. Please sign in again.");
      return;
    }
    const { error } = await supabase
      .from("profiles")
      .update({
        height_cm: inchesToCentimeters(data.heightIn),
        weight_kg: poundsToKilograms(data.weightLb),
        target_weight: poundsToKilograms(data.targetWeight),
        birthday: data.birthday,
        gender: data.gender,
        activity_level: data.activityLevel,
        goal: data.goal,
        daily_calorie_goal: goals.dailyCalorieGoal,
      })
      .eq("id", auth.user.id);
    setMessage(
      error ? error.message : "Profile saved. Your calorie goal is ready.",
    );
  }
  return (
    <form
      className="mt-8 grid gap-6 xl:grid-cols-5"
      onSubmit={form.handleSubmit(submit)}
    >
      <Card className="xl:col-span-3">
        <div className="grid gap-5 sm:grid-cols-2">
          <NumberField form={form} id="heightIn" label="Height (in)" />
          <NumberField form={form} id="weightLb" label="Current weight (lb)" />
          <NumberField
            form={form}
            id="targetWeight"
            label="Target weight (lb)"
          />
          <DateField form={form} />
          <SelectField
            form={form}
            id="gender"
            label="Gender"
            options={choices.gender}
          />
          <SelectField
            form={form}
            id="activityLevel"
            label="Activity level"
            options={choices.activityLevel}
          />
          <div className="sm:col-span-2">
            <SelectField
              form={form}
              id="goal"
              label="Goal"
              options={choices.goal}
            />
          </div>
        </div>
        {message ? (
          <p aria-live="polite" className="mt-5 text-sm text-slate-600">
            {message}
          </p>
        ) : null}
        <Button
          className="mt-6"
          disabled={form.formState.isSubmitting}
          type="submit"
        >
          {form.formState.isSubmitting ? "Saving…" : "Save profile"}
        </Button>
      </Card>
      <Card className="h-fit xl:col-span-2">
        <p className="text-sm font-semibold text-emerald-600">YOUR PLAN</p>
        <h2 className="mt-1 text-xl font-bold">Personalized daily target</h2>
        {calculations ? (
          <div className="mt-6 space-y-4">
            <Metric
              label="Daily calorie goal"
              value={`${calculations.dailyCalorieGoal} kcal`}
              strong
            />
            <Metric label="BMI" value={calculations.bmi.toFixed(1)} />
            <Metric label="BMR" value={`${calculations.bmr} kcal`} />
            <Metric
              label="Estimated TDEE"
              value={`${calculations.tdee} kcal`}
            />
            <p className="pt-2 text-xs leading-5 text-slate-500">
              Calculated with Mifflin–St Jeor and your activity level. This is a
              starting estimate, not medical advice.
            </p>
          </div>
        ) : (
          <p className="mt-5 text-sm leading-6 text-slate-500">
            Fill in every field to see your personalized calorie target.
          </p>
        )}
      </Card>
    </form>
  );
}
function Metric({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-slate-100 pb-3">
      <span className="text-sm text-slate-500">{label}</span>
      <span
        className={
          strong ? "text-lg font-bold text-emerald-700" : "font-semibold"
        }
      >
        {value}
      </span>
    </div>
  );
}
function Error({ message }: { message?: string }) {
  return message ? (
    <p className="mt-1 text-xs text-red-600">{message}</p>
  ) : null;
}
function NumberField({
  form,
  id,
  label,
}: {
  form: ReturnType<typeof useForm<FormValues>>;
  id: "heightIn" | "weightLb" | "targetWeight";
  label: string;
}) {
  return (
    <div>
      <label className="text-sm font-medium text-slate-700" htmlFor={id}>
        {label}
      </label>
      <input
        className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-emerald-500"
        id={id}
        step="0.1"
        type="number"
        {...form.register(id, { valueAsNumber: true })}
      />
      <Error message={form.formState.errors[id]?.message} />
    </div>
  );
}
function DateField({ form }: { form: ReturnType<typeof useForm<FormValues>> }) {
  return (
    <div>
      <label className="text-sm font-medium text-slate-700" htmlFor="birthday">
        Birthday
      </label>
      <input
        className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-emerald-500"
        id="birthday"
        type="date"
        {...form.register("birthday")}
      />
      <Error message={form.formState.errors.birthday?.message} />
    </div>
  );
}
function SelectField({
  form,
  id,
  label,
  options,
}: {
  form: ReturnType<typeof useForm<FormValues>>;
  id: "gender" | "activityLevel" | "goal";
  label: string;
  options: readonly (readonly [string, string])[];
}) {
  return (
    <div>
      <label className="text-sm font-medium text-slate-700" htmlFor={id}>
        {label}
      </label>
      <select
        className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 outline-none focus:border-emerald-500"
        id={id}
        {...form.register(id)}
      >
        <option value="">Select an option</option>
        {options.map(([value, text]) => (
          <option key={value} value={value}>
            {text}
          </option>
        ))}
      </select>
      <Error message={form.formState.errors[id]?.message} />
    </div>
  );
}
