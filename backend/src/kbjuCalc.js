// Расчёт нормы калорий и БЖУ по параметрам профиля.
// Формула Миффлина-Сан Жеора для базового обмена (BMR),
// умножение на коэффициент активности (TDEE),
// корректировка под цель, деление на БЖУ по стандартным пропорциям.

const ACTIVITY_FACTORS = {
  sedentary: 1.2, // сидячий образ жизни
  light: 1.375, // лёгкая активность (1-3 тренировки/нед)
  moderate: 1.55, // умеренная (3-5 тренировок/нед)
  active: 1.725, // высокая (6-7 тренировок/нед)
  very_active: 1.9, // очень высокая (физ. работа + тренировки)
};

const GOAL_ADJUSTMENT = {
  lose: -0.15, // дефицит 15%
  maintain: 0,
  gain: 0.15, // профицит 15%
};

export function calculateTargets(profile) {
  const { gender, age, heightCm, weightKg, activity, goal } = profile;

  const bmr =
    gender === "male"
      ? 10 * weightKg + 6.25 * heightCm - 5 * age + 5
      : 10 * weightKg + 6.25 * heightCm - 5 * age - 161;

  const activityFactor = ACTIVITY_FACTORS[activity] ?? 1.2;
  const tdee = bmr * activityFactor;

  const adjustment = GOAL_ADJUSTMENT[goal] ?? 0;
  const targetCalories = tdee * (1 + adjustment);

  // Пропорции БЖУ: белки 30%, жиры 25%, углеводы 45% от калорий (можно позже сделать настраиваемыми)
  const proteinCalories = targetCalories * 0.3;
  const fatCalories = targetCalories * 0.25;
  const carbsCalories = targetCalories * 0.45;

  return {
    calories: Math.round(targetCalories),
    protein: Math.round(proteinCalories / 4), // 4 ккал/г белка
    fat: Math.round(fatCalories / 9), // 9 ккал/г жира
    carbs: Math.round(carbsCalories / 4), // 4 ккал/г углеводов
  };
}
