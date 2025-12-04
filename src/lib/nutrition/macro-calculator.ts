import { OnboardingFormData } from '@/types/database';

export function calculateNutritionPlan(data: OnboardingFormData) {
  // 1. Calculate BMR (Basal Metabolic Rate) - Mifflin-St Jeor Equation
  // Men: (10 × weight in kg) + (6.25 × height in cm) - (5 × age in years) + 5
  // Women: (10 × weight in kg) + (6.25 × height in cm) - (5 × age in years) - 161
  
  const weight = Number(data.weight_kg) || 70;
  const height = Number(data.height_cm) || 175;
  const age = Number(data.age) || 25;
  const isMale = data.sex === 'male';

  let bmr = (10 * weight) + (6.25 * height) - (5 * age);
  bmr += isMale ? 5 : -161;

  // 2. Calculate TDEE (Total Daily Energy Expenditure) based on activity
  // We approximate activity based on "days_per_week" they selected
  const days = Number(data.available_days_per_week) || 3;
  let activityMultiplier = 1.2; // Sedentary base

  if (days >= 1 && days <= 2) activityMultiplier = 1.375; // Light
  else if (days >= 3 && days <= 4) activityMultiplier = 1.55; // Moderate
  else if (days >= 5 && days <= 6) activityMultiplier = 1.725; // Heavy
  else if (days >= 7) activityMultiplier = 1.9; // Athlete

  const tdee = Math.round(bmr * activityMultiplier);

  // 3. Adjust for Goal
  let targetCalories = tdee;
  let proteinRatio = 0.3;
  let fatRatio = 0.25;
  let carbRatio = 0.45;

  switch (data.primary_goal) {
    case 'fat_loss':
      targetCalories = tdee - 500; // 500 cal deficit
      proteinRatio = 0.40; // High protein to spare muscle
      fatRatio = 0.30;
      carbRatio = 0.30;
      break;
    case 'muscle_gain':
      targetCalories = tdee + 300; // Small surplus
      proteinRatio = 0.30;
      fatRatio = 0.25;
      carbRatio = 0.45; // Carbs for energy
      break;
    case 'strength':
      targetCalories = tdee + 200; // Performance maintenance
      proteinRatio = 0.35;
      fatRatio = 0.30;
      carbRatio = 0.35;
      break;
    default: // general_fitness
      targetCalories = tdee; // Maintenance
      proteinRatio = 0.30;
      fatRatio = 0.30;
      carbRatio = 0.40;
  }

  // 4. Calculate Grams (Protein/Carbs = 4cal/g, Fat = 9cal/g)
  const proteinGrams = Math.round((targetCalories * proteinRatio) / 4);
  const fatGrams = Math.round((targetCalories * fatRatio) / 9);
  const carbGrams = Math.round((targetCalories * carbRatio) / 4);

  return {
    daily_calories: Math.round(targetCalories),
    macros: {
      protein_grams: proteinGrams,
      carbs_grams: carbGrams,
      fat_grams: fatGrams,
    },
    hydration_liters: Math.round((weight * 0.033) * 10) / 10 // ~35ml per kg
  };
}