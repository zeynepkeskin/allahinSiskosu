import { z } from "zod";

export const exerciseSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(1).max(120),
  sets: z.number().int().min(1).max(30),
  reps: z.number().int().min(1).max(500),
  weightLb: z.number().min(0).max(5000).nullable(),
  restSeconds: z.number().int().min(0).max(1800),
  setDurationSeconds: z.number().int().min(1).max(7200).nullable(),
});
export const planSchema = z.object({
  exercises: z.array(exerciseSchema).min(1).max(30),
});
export type Exercise = z.infer<typeof exerciseSchema> & { id?: string };
export type ExercisePlan = {
  id: string;
  dayOfWeek: number;
  exercises: Exercise[];
};
type ExerciseJson = Record<string, unknown>;

export function exercisePlanFromRow(row: {
  id: string;
  day_of_week: number;
  exercises: unknown;
}): ExercisePlan {
  return {
    id: row.id,
    dayOfWeek: row.day_of_week,
    exercises: ((row.exercises ?? []) as ExerciseJson[])
      .sort((a, b) => Number(a.sort_order) - Number(b.sort_order))
      .map((exercise) => ({
        id: String(exercise.id),
        name: String(exercise.name),
        sets: Number(exercise.sets),
        reps: Number(exercise.reps),
        weightLb:
          exercise.weight_lb === null ? null : Number(exercise.weight_lb),
        restSeconds: Number(exercise.rest_seconds),
        setDurationSeconds:
          exercise.set_duration_seconds === null
            ? null
            : Number(exercise.set_duration_seconds),
      })),
  };
}
export const days = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
export function exercisePrescription(exercise: Exercise) {
  const weight =
    exercise.weightLb === null ? "bodyweight" : `${exercise.weightLb} lb`;
  return `${exercise.name} · ${exercise.sets} sets × ${exercise.reps} reps · ${weight}`;
}
