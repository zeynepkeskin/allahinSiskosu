export type MuscleId =
  | "biceps"
  | "triceps"
  | "forearms"
  | "chest"
  | "front-delts"
  | "side-delts"
  | "rear-delts"
  | "lats"
  | "upper-back"
  | "lower-back"
  | "traps"
  | "abs"
  | "obliques"
  | "glutes"
  | "quads"
  | "hamstrings"
  | "calves";

export type BodyView = "front" | "back";

export type ExerciseVisual = {
  category: string;
  primary: MuscleId[];
  secondary: MuscleId[];
  views: BodyView[];
  demoId?: string;
};

export const muscleLabels: Record<MuscleId, string> = {
  biceps: "Biceps",
  triceps: "Triceps",
  forearms: "Forearms",
  chest: "Chest",
  "front-delts": "Front delts",
  "side-delts": "Side delts",
  "rear-delts": "Rear delts",
  lats: "Lats",
  "upper-back": "Upper back",
  "lower-back": "Lower back",
  traps: "Traps",
  abs: "Abs",
  obliques: "Obliques",
  glutes: "Glutes",
  quads: "Quads",
  hamstrings: "Hamstrings",
  calves: "Calves",
};

const visual = (
  category: string,
  primary: MuscleId[],
  secondary: MuscleId[],
  views: BodyView[],
  demoId?: string,
): ExerciseVisual => ({ category, primary, secondary, views, demoId });

export const exerciseCatalog: Record<string, ExerciseVisual> = {
  "Barbell Curl": visual(
    "Arms",
    ["biceps"],
    ["forearms"],
    ["front"],
    "Barbell_Curl",
  ),
  "Dumbbell Bicep Curl": visual(
    "Arms",
    ["biceps"],
    ["forearms"],
    ["front"],
    "Dumbbell_Bicep_Curl",
  ),
  "Hammer Curl": visual(
    "Arms",
    ["biceps", "forearms"],
    [],
    ["front"],
    "Hammer_Curls",
  ),
  "Preacher Curl": visual(
    "Arms",
    ["biceps"],
    ["forearms"],
    ["front"],
    "Preacher_Curl",
  ),
  "Cable Tricep Pushdown": visual(
    "Arms",
    ["triceps"],
    [],
    ["back"],
    "Triceps_Pushdown",
  ),
  "Skull Crusher": visual(
    "Arms",
    ["triceps"],
    [],
    ["back"],
    "Lying_Triceps_Press",
  ),
  "Overhead Tricep Extension": visual(
    "Arms",
    ["triceps"],
    [],
    ["back"],
    "Standing_Dumbbell_Triceps_Extension",
  ),
  "Tricep Dip": visual(
    "Arms",
    ["triceps"],
    ["chest", "front-delts"],
    ["front", "back"],
    "Dips_-_Triceps_Version",
  ),
  "Barbell Bench Press": visual(
    "Chest",
    ["chest"],
    ["triceps", "front-delts"],
    ["front", "back"],
    "Barbell_Bench_Press_-_Medium_Grip",
  ),
  "Dumbbell Bench Press": visual(
    "Chest",
    ["chest"],
    ["triceps", "front-delts"],
    ["front", "back"],
    "Dumbbell_Bench_Press",
  ),
  "Incline Dumbbell Press": visual(
    "Chest",
    ["chest"],
    ["triceps", "front-delts"],
    ["front", "back"],
    "Incline_Dumbbell_Press",
  ),
  "Chest Fly": visual(
    "Chest",
    ["chest"],
    ["front-delts"],
    ["front"],
    "Dumbbell_Flyes",
  ),
  "Cable Crossover": visual(
    "Chest",
    ["chest"],
    ["front-delts"],
    ["front"],
    "Cable_Crossover",
  ),
  "Push-Up": visual(
    "Chest",
    ["chest"],
    ["triceps", "front-delts", "abs"],
    ["front", "back"],
    "Pushups",
  ),
  "Pull-Up": visual(
    "Back",
    ["lats"],
    ["biceps", "upper-back"],
    ["front", "back"],
    "Pullups",
  ),
  "Lat Pulldown": visual(
    "Back",
    ["lats"],
    ["biceps", "upper-back"],
    ["front", "back"],
    "Wide-Grip_Lat_Pulldown",
  ),
  "Barbell Row": visual(
    "Back",
    ["lats", "upper-back"],
    ["biceps", "lower-back"],
    ["front", "back"],
    "Bent_Over_Barbell_Row",
  ),
  "Dumbbell Row": visual(
    "Back",
    ["lats"],
    ["biceps", "upper-back"],
    ["front", "back"],
    "One-Arm_Dumbbell_Row",
  ),
  "Seated Cable Row": visual(
    "Back",
    ["lats", "upper-back"],
    ["biceps"],
    ["front", "back"],
    "Seated_Cable_Rows",
  ),
  "Face Pull": visual(
    "Back",
    ["rear-delts", "upper-back"],
    ["biceps"],
    ["back"],
    "Face_Pull",
  ),
  "Back Extension": visual(
    "Back",
    ["lower-back"],
    ["glutes", "hamstrings"],
    ["back"],
    "Hyperextensions_Back_Extensions",
  ),
  "Overhead Press": visual(
    "Shoulders",
    ["front-delts", "side-delts"],
    ["triceps"],
    ["front", "back"],
    "Barbell_Shoulder_Press",
  ),
  "Dumbbell Shoulder Press": visual(
    "Shoulders",
    ["front-delts", "side-delts"],
    ["triceps"],
    ["front", "back"],
    "Dumbbell_Shoulder_Press",
  ),
  "Lateral Raise": visual(
    "Shoulders",
    ["side-delts"],
    ["traps"],
    ["front", "back"],
    "Side_Lateral_Raise",
  ),
  "Front Raise": visual(
    "Shoulders",
    ["front-delts"],
    ["chest"],
    ["front"],
    "Front_Dumbbell_Raise",
  ),
  "Rear Delt Fly": visual(
    "Shoulders",
    ["rear-delts"],
    ["upper-back"],
    ["back"],
    "Dumbbell_Lying_Rear_Lateral_Raise",
  ),
  "Upright Row": visual(
    "Shoulders",
    ["side-delts", "traps"],
    ["biceps"],
    ["front", "back"],
    "Upright_Row_-_With_Bands",
  ),
  "Barbell Back Squat": visual(
    "Legs",
    ["quads", "glutes"],
    ["hamstrings", "lower-back"],
    ["front", "back"],
    "Barbell_Full_Squat",
  ),
  "Front Squat": visual(
    "Legs",
    ["quads", "glutes"],
    ["abs"],
    ["front", "back"],
    "Front_Squat_Clean_Grip",
  ),
  "Leg Press": visual(
    "Legs",
    ["quads", "glutes"],
    ["hamstrings"],
    ["front", "back"],
    "Leg_Press",
  ),
  "Romanian Deadlift": visual(
    "Legs",
    ["hamstrings", "glutes"],
    ["lower-back"],
    ["back"],
    "Romanian_Deadlift",
  ),
  "Leg Curl": visual(
    "Legs",
    ["hamstrings"],
    ["calves"],
    ["back"],
    "Lying_Leg_Curls",
  ),
  "Leg Extension": visual("Legs", ["quads"], [], ["front"], "Leg_Extensions"),
  "Walking Lunge": visual(
    "Legs",
    ["quads", "glutes"],
    ["hamstrings", "calves"],
    ["front", "back"],
    "Bodyweight_Walking_Lunge",
  ),
  "Calf Raise": visual(
    "Legs",
    ["calves"],
    [],
    ["front", "back"],
    "Standing_Calf_Raises",
  ),
  Plank: visual(
    "Core",
    ["abs"],
    ["obliques", "front-delts"],
    ["front"],
    "Plank",
  ),
  Crunch: visual("Core", ["abs"], ["obliques"], ["front"], "Crunches"),
  "Hanging Leg Raise": visual(
    "Core",
    ["abs"],
    ["quads"],
    ["front"],
    "Hanging_Leg_Raise",
  ),
  "Cable Crunch": visual(
    "Core",
    ["abs"],
    ["obliques"],
    ["front"],
    "Cable_Crunch",
  ),
  "Russian Twist": visual(
    "Core",
    ["obliques"],
    ["abs"],
    ["front"],
    "Russian_Twist",
  ),
  "Ab Wheel Rollout": visual(
    "Core",
    ["abs"],
    ["front-delts", "lats"],
    ["front", "back"],
    "Ab_Roller",
  ),
  Deadlift: visual(
    "Full Body & Conditioning",
    ["glutes", "hamstrings"],
    ["lower-back", "quads", "traps"],
    ["front", "back"],
    "Barbell_Deadlift",
  ),
  "Kettlebell Swing": visual(
    "Full Body & Conditioning",
    ["glutes", "hamstrings"],
    ["abs", "front-delts"],
    ["front", "back"],
    "One-Arm_Kettlebell_Swings",
  ),
  "Clean and Press": visual(
    "Full Body & Conditioning",
    ["quads", "front-delts"],
    ["glutes", "traps", "triceps"],
    ["front", "back"],
    "Clean_and_Press",
  ),
  Burpee: visual(
    "Full Body & Conditioning",
    ["quads", "chest"],
    ["abs", "front-delts", "triceps"],
    ["front", "back"],
  ),
  "Farmer Carry": visual(
    "Full Body & Conditioning",
    ["forearms", "traps"],
    ["abs", "quads"],
    ["front", "back"],
    "Farmers_Walk",
  ),
  "Sled Push": visual(
    "Full Body & Conditioning",
    ["quads", "glutes"],
    ["chest", "front-delts", "calves"],
    ["front", "back"],
    "Sled_Push",
  ),
};

export const exerciseGroups = Object.entries(exerciseCatalog).reduce<
  { label: string; exercises: string[] }[]
>((groups, [name, item]) => {
  const group = groups.find((candidate) => candidate.label === item.category);
  if (group) group.exercises.push(name);
  else groups.push({ label: item.category, exercises: [name] });
  return groups;
}, []);

export function getExerciseVisual(name: string) {
  return exerciseCatalog[name];
}

export function demoFrames(demoId: string) {
  return {
    start: `/exercises/${demoId}/0.jpg`,
    finish: `/exercises/${demoId}/1.jpg`,
  };
}
