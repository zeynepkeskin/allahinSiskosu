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
  popularity: ExercisePopularity;
  equipment: EquipmentId[];
};

export type ExercisePopularity = "most-popular" | "common" | "less-common";
export type EquipmentId =
  | "bodyweight"
  | "dumbbells"
  | "barbell"
  | "weight_plates"
  | "bench"
  | "squat_rack"
  | "pull_up_bar"
  | "cable_machine"
  | "resistance_bands"
  | "kettlebells"
  | "cardio_equipment";

export const popularityChoices = [
  ["most-popular", "Most Popular"],
  ["common", "Common"],
  ["less-common", "Less Common"],
] as const satisfies readonly (readonly [ExercisePopularity, string])[];

export const equipmentChoices = [
  ["bodyweight", "Bodyweight"],
  ["dumbbells", "Dumbbells"],
  ["barbell", "Barbell"],
  ["weight_plates", "Weight plates"],
  ["bench", "Bench"],
  ["squat_rack", "Squat rack / cage"],
  ["pull_up_bar", "Pull-up bar"],
  ["cable_machine", "Cable machine"],
  ["resistance_bands", "Resistance bands"],
  ["kettlebells", "Kettlebells"],
  ["cardio_equipment", "Cardio equipment"],
] as const satisfies readonly (readonly [EquipmentId, string])[];

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
): Omit<ExerciseVisual, "popularity" | "equipment"> => ({
  category,
  primary,
  secondary,
  views,
  demoId,
});

const baseExerciseCatalog = {
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
  "Concentration Curl": visual("Arms", ["biceps"], ["forearms"], ["front"]),
  "Incline Dumbbell Curl": visual("Arms", ["biceps"], ["forearms"], ["front"]),
  "Resistance Band Curl": visual("Arms", ["biceps"], ["forearms"], ["front"]),
  "Diamond Push-Up": visual(
    "Arms",
    ["triceps"],
    ["chest", "front-delts"],
    ["front", "back"],
  ),
  "Tricep Kickback": visual("Arms", ["triceps"], [], ["back"]),
  "Close-Grip Bench Press": visual(
    "Arms",
    ["triceps"],
    ["chest", "front-delts"],
    ["front", "back"],
  ),
  "Incline Barbell Bench Press": visual(
    "Chest",
    ["chest"],
    ["triceps", "front-delts"],
    ["front", "back"],
  ),
  "Decline Push-Up": visual(
    "Chest",
    ["chest"],
    ["triceps", "front-delts"],
    ["front", "back"],
  ),
  "Resistance Band Chest Press": visual(
    "Chest",
    ["chest"],
    ["triceps", "front-delts"],
    ["front"],
  ),
  "Dumbbell Pullover": visual(
    "Chest",
    ["chest"],
    ["lats", "triceps"],
    ["front", "back"],
  ),
  "Chin-Up": visual(
    "Back",
    ["lats", "biceps"],
    ["upper-back"],
    ["front", "back"],
  ),
  "Inverted Row": visual(
    "Back",
    ["upper-back", "lats"],
    ["biceps"],
    ["front", "back"],
  ),
  "Straight-Arm Pulldown": visual(
    "Back",
    ["lats"],
    ["triceps"],
    ["front", "back"],
  ),
  "Resistance Band Row": visual(
    "Back",
    ["lats", "upper-back"],
    ["biceps"],
    ["front", "back"],
  ),
  Shrug: visual("Back", ["traps"], ["forearms"], ["front", "back"]),
  "Arnold Press": visual(
    "Shoulders",
    ["front-delts", "side-delts"],
    ["triceps"],
    ["front", "back"],
  ),
  "Cable Lateral Raise": visual(
    "Shoulders",
    ["side-delts"],
    ["traps"],
    ["front", "back"],
  ),
  "Pike Push-Up": visual(
    "Shoulders",
    ["front-delts", "side-delts"],
    ["triceps"],
    ["front", "back"],
  ),
  "Band Pull-Apart": visual(
    "Shoulders",
    ["rear-delts", "upper-back"],
    ["traps"],
    ["back"],
  ),
  "Bulgarian Split Squat": visual(
    "Legs",
    ["quads", "glutes"],
    ["hamstrings"],
    ["front", "back"],
  ),
  "Goblet Squat": visual(
    "Legs",
    ["quads", "glutes"],
    ["hamstrings", "abs"],
    ["front", "back"],
  ),
  "Hip Thrust": visual("Legs", ["glutes"], ["hamstrings"], ["back"]),
  "Step-Up": visual(
    "Legs",
    ["quads", "glutes"],
    ["hamstrings", "calves"],
    ["front", "back"],
  ),
  "Single-Leg Romanian Deadlift": visual(
    "Legs",
    ["hamstrings", "glutes"],
    ["lower-back"],
    ["back"],
  ),
  "Side Plank": visual("Core", ["obliques"], ["abs", "side-delts"], ["front"]),
  "Dead Bug": visual("Core", ["abs"], ["obliques"], ["front"]),
  "Bicycle Crunch": visual("Core", ["abs", "obliques"], [], ["front"]),
  "Pallof Press": visual(
    "Core",
    ["obliques", "abs"],
    ["front-delts"],
    ["front"],
  ),
  "Mountain Climber": visual(
    "Core",
    ["abs"],
    ["quads", "front-delts"],
    ["front"],
  ),
  "Turkish Get-Up": visual(
    "Full Body & Conditioning",
    ["glutes", "front-delts"],
    ["abs", "quads", "triceps"],
    ["front", "back"],
  ),
  "Battle Ropes": visual(
    "Full Body & Conditioning",
    ["front-delts", "abs"],
    ["biceps", "triceps"],
    ["front", "back"],
  ),
  "Jump Rope": visual(
    "Full Body & Conditioning",
    ["calves"],
    ["quads", "front-delts"],
    ["front", "back"],
  ),
  "Dumbbell Thruster": visual(
    "Full Body & Conditioning",
    ["quads", "front-delts"],
    ["glutes", "triceps", "abs"],
    ["front", "back"],
  ),
  "Bear Crawl": visual(
    "Full Body & Conditioning",
    ["abs", "front-delts"],
    ["quads", "triceps"],
    ["front", "back"],
  ),
};

type ExerciseMetadata = {
  popularity: ExercisePopularity;
  equipment: EquipmentId[];
};

const metadata: Record<string, ExerciseMetadata> = {
  "Barbell Curl": { popularity: "most-popular", equipment: ["barbell"] },
  "Dumbbell Bicep Curl": {
    popularity: "most-popular",
    equipment: ["dumbbells"],
  },
  "Hammer Curl": { popularity: "most-popular", equipment: ["dumbbells"] },
  "Preacher Curl": {
    popularity: "most-popular",
    equipment: ["dumbbells", "bench"],
  },
  "Cable Tricep Pushdown": {
    popularity: "most-popular",
    equipment: ["cable_machine"],
  },
  "Skull Crusher": {
    popularity: "most-popular",
    equipment: ["barbell", "bench"],
  },
  "Overhead Tricep Extension": {
    popularity: "most-popular",
    equipment: ["dumbbells"],
  },
  "Tricep Dip": {
    popularity: "most-popular",
    equipment: ["bodyweight", "bench"],
  },
  "Barbell Bench Press": {
    popularity: "most-popular",
    equipment: ["barbell", "bench", "squat_rack"],
  },
  "Dumbbell Bench Press": {
    popularity: "most-popular",
    equipment: ["dumbbells", "bench"],
  },
  "Incline Dumbbell Press": {
    popularity: "most-popular",
    equipment: ["dumbbells", "bench"],
  },
  "Chest Fly": {
    popularity: "most-popular",
    equipment: ["dumbbells", "bench"],
  },
  "Cable Crossover": {
    popularity: "most-popular",
    equipment: ["cable_machine"],
  },
  "Push-Up": { popularity: "most-popular", equipment: ["bodyweight"] },
  "Pull-Up": {
    popularity: "most-popular",
    equipment: ["bodyweight", "pull_up_bar"],
  },
  "Lat Pulldown": { popularity: "most-popular", equipment: ["cable_machine"] },
  "Barbell Row": { popularity: "most-popular", equipment: ["barbell"] },
  "Dumbbell Row": {
    popularity: "most-popular",
    equipment: ["dumbbells", "bench"],
  },
  "Seated Cable Row": {
    popularity: "most-popular",
    equipment: ["cable_machine"],
  },
  "Face Pull": { popularity: "most-popular", equipment: ["cable_machine"] },
  "Back Extension": {
    popularity: "most-popular",
    equipment: ["bodyweight", "bench"],
  },
  "Overhead Press": {
    popularity: "most-popular",
    equipment: ["barbell", "squat_rack"],
  },
  "Dumbbell Shoulder Press": {
    popularity: "most-popular",
    equipment: ["dumbbells"],
  },
  "Lateral Raise": { popularity: "most-popular", equipment: ["dumbbells"] },
  "Front Raise": { popularity: "most-popular", equipment: ["dumbbells"] },
  "Rear Delt Fly": {
    popularity: "most-popular",
    equipment: ["dumbbells", "bench"],
  },
  "Upright Row": {
    popularity: "most-popular",
    equipment: ["resistance_bands"],
  },
  "Barbell Back Squat": {
    popularity: "most-popular",
    equipment: ["barbell", "squat_rack"],
  },
  "Front Squat": {
    popularity: "most-popular",
    equipment: ["barbell", "squat_rack"],
  },
  "Leg Press": { popularity: "most-popular", equipment: ["cardio_equipment"] },
  "Romanian Deadlift": { popularity: "most-popular", equipment: ["barbell"] },
  "Leg Curl": { popularity: "most-popular", equipment: ["cardio_equipment"] },
  "Leg Extension": {
    popularity: "most-popular",
    equipment: ["cardio_equipment"],
  },
  "Walking Lunge": { popularity: "most-popular", equipment: ["bodyweight"] },
  "Calf Raise": { popularity: "most-popular", equipment: ["bodyweight"] },
  Plank: { popularity: "most-popular", equipment: ["bodyweight"] },
  Crunch: { popularity: "most-popular", equipment: ["bodyweight"] },
  "Hanging Leg Raise": {
    popularity: "most-popular",
    equipment: ["bodyweight", "pull_up_bar"],
  },
  "Cable Crunch": { popularity: "most-popular", equipment: ["cable_machine"] },
  "Russian Twist": { popularity: "most-popular", equipment: ["bodyweight"] },
  "Ab Wheel Rollout": {
    popularity: "most-popular",
    equipment: ["weight_plates"],
  },
  Deadlift: {
    popularity: "most-popular",
    equipment: ["barbell", "weight_plates"],
  },
  "Kettlebell Swing": {
    popularity: "most-popular",
    equipment: ["kettlebells"],
  },
  "Clean and Press": {
    popularity: "most-popular",
    equipment: ["barbell", "weight_plates"],
  },
  Burpee: { popularity: "most-popular", equipment: ["bodyweight"] },
  "Farmer Carry": { popularity: "most-popular", equipment: ["dumbbells"] },
  "Sled Push": { popularity: "most-popular", equipment: ["cardio_equipment"] },
  "Concentration Curl": {
    popularity: "common",
    equipment: ["dumbbells", "bench"],
  },
  "Incline Dumbbell Curl": {
    popularity: "common",
    equipment: ["dumbbells", "bench"],
  },
  "Resistance Band Curl": {
    popularity: "less-common",
    equipment: ["resistance_bands"],
  },
  "Diamond Push-Up": { popularity: "common", equipment: ["bodyweight"] },
  "Tricep Kickback": { popularity: "common", equipment: ["dumbbells"] },
  "Close-Grip Bench Press": {
    popularity: "less-common",
    equipment: ["barbell", "bench", "squat_rack"],
  },
  "Incline Barbell Bench Press": {
    popularity: "common",
    equipment: ["barbell", "bench", "squat_rack"],
  },
  "Decline Push-Up": {
    popularity: "common",
    equipment: ["bodyweight", "bench"],
  },
  "Resistance Band Chest Press": {
    popularity: "less-common",
    equipment: ["resistance_bands"],
  },
  "Dumbbell Pullover": {
    popularity: "less-common",
    equipment: ["dumbbells", "bench"],
  },
  "Chin-Up": { popularity: "common", equipment: ["bodyweight", "pull_up_bar"] },
  "Inverted Row": {
    popularity: "common",
    equipment: ["bodyweight", "squat_rack"],
  },
  "Straight-Arm Pulldown": {
    popularity: "less-common",
    equipment: ["cable_machine"],
  },
  "Resistance Band Row": {
    popularity: "common",
    equipment: ["resistance_bands"],
  },
  Shrug: { popularity: "less-common", equipment: ["dumbbells"] },
  "Arnold Press": { popularity: "common", equipment: ["dumbbells"] },
  "Cable Lateral Raise": { popularity: "common", equipment: ["cable_machine"] },
  "Pike Push-Up": { popularity: "common", equipment: ["bodyweight"] },
  "Band Pull-Apart": {
    popularity: "less-common",
    equipment: ["resistance_bands"],
  },
  "Bulgarian Split Squat": {
    popularity: "common",
    equipment: ["bodyweight", "bench"],
  },
  "Goblet Squat": { popularity: "common", equipment: ["dumbbells"] },
  "Hip Thrust": { popularity: "common", equipment: ["barbell", "bench"] },
  "Step-Up": { popularity: "common", equipment: ["bodyweight", "bench"] },
  "Single-Leg Romanian Deadlift": {
    popularity: "less-common",
    equipment: ["dumbbells"],
  },
  "Side Plank": { popularity: "common", equipment: ["bodyweight"] },
  "Dead Bug": { popularity: "common", equipment: ["bodyweight"] },
  "Bicycle Crunch": { popularity: "common", equipment: ["bodyweight"] },
  "Pallof Press": { popularity: "less-common", equipment: ["cable_machine"] },
  "Mountain Climber": { popularity: "common", equipment: ["bodyweight"] },
  "Turkish Get-Up": { popularity: "less-common", equipment: ["kettlebells"] },
  "Battle Ropes": {
    popularity: "less-common",
    equipment: ["cardio_equipment"],
  },
  "Jump Rope": { popularity: "common", equipment: ["cardio_equipment"] },
  "Dumbbell Thruster": { popularity: "common", equipment: ["dumbbells"] },
  "Bear Crawl": { popularity: "less-common", equipment: ["bodyweight"] },
};

export const exerciseCatalog: Record<string, ExerciseVisual> =
  Object.fromEntries(
    Object.entries(baseExerciseCatalog).map(([name, item]) => [
      name,
      { ...item, ...metadata[name] },
    ]),
  );

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
