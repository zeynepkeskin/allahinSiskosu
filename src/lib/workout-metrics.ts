export type WorkoutExerciseRow = {
  planned_sets: number | string;
  planned_reps: number | string;
  completed_sets: number | string;
  weight_lb: number | string | null;
};

export type WorkoutSessionRow = {
  id: string;
  status: "in_progress" | "completed" | "ended_early";
  started_at: string;
  completed_at: string | null;
  workout_session_exercises?: WorkoutExerciseRow[] | null;
};

export type WorkoutMetrics = {
  completedWorkouts: number;
  workoutDays: number;
  completedSets: number;
  completedReps: number;
  loadedVolume: number;
  averageDurationMinutes: number | null;
};

const number = (value: number | string | null | undefined) =>
  Number(value) || 0;

/** Uses the same server-local calendar convention as the existing meal views. */
export function calendarDateKey(value: Date | string) {
  const date = typeof value === "string" ? new Date(value) : value;
  return [date.getFullYear(), date.getMonth(), date.getDate()].join("-");
}

export function completedWorkoutSessions(sessions: WorkoutSessionRow[]) {
  return sessions.filter(
    (session) => session.status === "completed" && session.completed_at,
  );
}

export function calculateWorkoutMetrics(
  sessions: WorkoutSessionRow[],
): WorkoutMetrics {
  const completed = completedWorkoutSessions(sessions);
  const durations = completed
    .map((session) =>
      session.completed_at
        ? Math.max(
            0,
            new Date(session.completed_at).getTime() -
              new Date(session.started_at).getTime(),
          ) / 60_000
        : null,
    )
    .filter((duration): duration is number => duration !== null);
  const totals = completed.reduce(
    (total, session) => {
      for (const exercise of session.workout_session_exercises ?? []) {
        const completedSets = Math.min(
          number(exercise.completed_sets),
          number(exercise.planned_sets),
        );
        const reps = completedSets * number(exercise.planned_reps);
        total.completedSets += completedSets;
        total.completedReps += reps;
        const weight =
          exercise.weight_lb === null ? null : number(exercise.weight_lb);
        if (weight !== null) total.loadedVolume += reps * weight;
      }
      return total;
    },
    { completedSets: 0, completedReps: 0, loadedVolume: 0 },
  );
  return {
    completedWorkouts: completed.length,
    workoutDays: new Set(
      completed.map((session) => calendarDateKey(session.started_at)),
    ).size,
    ...totals,
    loadedVolume: Math.round(totals.loadedVolume),
    averageDurationMinutes: durations.length
      ? Math.round(
          durations.reduce((sum, duration) => sum + duration, 0) /
            durations.length,
        )
      : null,
  };
}

export function countPlannedWorkoutDays(
  plans: Array<{ day_of_week: number; is_rest_day: boolean }>,
  start: Date,
  length: number,
) {
  const trainingDays = new Set(
    plans.filter((plan) => !plan.is_rest_day).map((plan) => plan.day_of_week),
  );
  return Array.from({ length }, (_, index) => {
    const date = new Date(start);
    date.setDate(date.getDate() + index);
    return trainingDays.has(date.getDay());
  }).filter(Boolean).length;
}
