export type Gender = "female" | "male" | "non_binary" | "prefer_not_to_say";
export type ActivityLevel =
  | "sedentary"
  | "lightly_active"
  | "moderately_active"
  | "very_active"
  | "extra_active";
export type Goal = "lose" | "maintain" | "gain";

export type ProfileCalculationInput = {
  heightIn: number;
  weightLb: number;
  birthday: string;
  gender: Gender;
  activityLevel: ActivityLevel;
  goal: Goal;
};
export type ProfileCalculations = {
  age: number;
  bmi: number;
  bmr: number;
  tdee: number;
  dailyCalorieGoal: number;
};

const activityMultipliers: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  lightly_active: 1.375,
  moderately_active: 1.55,
  very_active: 1.725,
  extra_active: 1.9,
};

export function ageFromBirthday(birthday: string, today = new Date()) {
  const birthDate = new Date(`${birthday}T00:00:00`);
  let age = today.getFullYear() - birthDate.getFullYear();
  if (
    today.getMonth() < birthDate.getMonth() ||
    (today.getMonth() === birthDate.getMonth() &&
      today.getDate() < birthDate.getDate())
  )
    age -= 1;
  return age;
}

export function calculateProfileGoals(
  input: ProfileCalculationInput,
): ProfileCalculations {
  const age = ageFromBirthday(input.birthday);
  const bmi = (input.weightLb * 703) / input.heightIn ** 2;
  const weightKg = input.weightLb * 0.45359237;
  const heightCm = input.heightIn * 2.54;
  const baseBmr = 10 * weightKg + 6.25 * heightCm - 5 * age;
  const adjustment =
    input.gender === "male" ? 5 : input.gender === "female" ? -161 : -78;
  const bmr = baseBmr + adjustment;
  const tdee = bmr * activityMultipliers[input.activityLevel];
  const goalAdjustment =
    input.goal === "lose" ? -500 : input.goal === "gain" ? 300 : 0;
  return {
    age,
    bmi: Math.round(bmi * 10) / 10,
    bmr: Math.round(bmr),
    tdee: Math.round(tdee),
    dailyCalorieGoal: Math.max(
      input.gender === "male" ? 1500 : 1200,
      Math.round(tdee + goalAdjustment),
    ),
  };
}
