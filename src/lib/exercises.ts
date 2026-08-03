import { z } from "zod";

export const exerciseSchema = z.object({
  name: z.string().trim().min(1).max(120),
  sets: z.number().int().min(1).max(30),
  reps: z.number().int().min(1).max(500),
  weightLb: z.number().min(0).max(5000).nullable(),
  restSeconds: z.number().int().min(0).max(1800),
  setDurationSeconds: z.number().int().min(1).max(7200).nullable(),
});
export const planSchema = z
  .object({
    isRestDay: z.boolean(),
    exercises: z.array(exerciseSchema).max(30),
  })
  .refine((value) => value.isRestDay || value.exercises.length > 0, {
    message: "Add an exercise or mark the day as rest.",
  });
export type Exercise = z.infer<typeof exerciseSchema> & { id?: string };
export type ExercisePlan = {
  id: string;
  dayOfWeek: number;
  isRestDay: boolean;
  exercises: Exercise[];
};
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
