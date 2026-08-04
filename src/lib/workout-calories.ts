export type WorkoutExerciseForCalories = {
  completed_sets: number | string;
  planned_reps: number | string;
  weight_lb: number | string | null;
  rest_seconds: number | string;
  set_duration_seconds?: number | string | null;
};

const number = (value: number | string | null | undefined) =>
  Number(value) || 0;

/** Estimates strength-training calories from recorded duration and relative load. */
export function estimateWorkoutCalories(
  exercises: WorkoutExerciseForCalories[],
  weightKg: number | string | null | undefined,
) {
  const bodyWeightKg = number(weightKg);
  if (bodyWeightKg <= 0) return null;

  const bodyWeightLb = bodyWeightKg / 0.45359237;
  let durationSeconds = 0;
  let completedReps = 0;
  let relativeLoadTotal = 0;

  for (const exercise of exercises) {
    const completedSets = number(exercise.completed_sets);
    if (completedSets <= 0) continue;

    const reps = number(exercise.planned_reps);
    const setSeconds = Math.min(
      90,
      Math.max(20, number(exercise.set_duration_seconds) || reps * 3),
    );
    durationSeconds += completedSets * setSeconds;
    durationSeconds +=
      Math.max(0, completedSets - 1) * number(exercise.rest_seconds);

    const exerciseReps = completedSets * reps;
    completedReps += exerciseReps;
    const loadLb =
      exercise.weight_lb === null
        ? bodyWeightLb * 0.6
        : number(exercise.weight_lb);
    relativeLoadTotal += exerciseReps * (loadLb / bodyWeightLb);
  }

  if (durationSeconds <= 0) return 0;
  const relativeLoad = completedReps ? relativeLoadTotal / completedReps : 0;
  const met = Math.min(6.5, Math.max(3.5, 3.5 + relativeLoad * 2));
  return Math.round(met * bodyWeightKg * (durationSeconds / 3600));
}
