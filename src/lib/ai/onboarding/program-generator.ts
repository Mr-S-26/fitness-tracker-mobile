import { supabase } from '@/lib/supabase/client';
import type { OnboardingFormData } from '@/types/database';
import { calculateNutritionPlan } from '@/lib/nutrition/macro-calculator';

// ==========================================
// 1. INTERFACES
// ==========================================

export interface WorkoutProgram {
  program_name: string;
  program_overview: string;
  duration_weeks: number;
  weeks: Array<{
    week_number: number;
    focus: string;
    workouts: Array<{
      day: string;
      workout_name: string;
      exercises: Array<{
        exercise_name: string;
        sets: number;
        reps: string;
        rest_seconds: number;
        notes?: string;
      }>;
    }>;
  }>;
}

// ==========================================
// 2. HELPER: SMART WEIGHT CALCULATOR
// ==========================================
function calculateLoad(exerciseName: string, equipment: string, formData: OnboardingFormData): number {
  const name = exerciseName.toLowerCase();
  
  // 1. Setup Baselines (Body Weight & Gender)
  // If weight is missing, assume 70kg. 
  // If sex is missing or female, use 0.65 multiplier for base strength estimates.
  const bw = Number(formData.weight_kg) || 70; 
  const isMale = formData.sex === 'male';
  const genderMod = isMale ? 1.0 : 0.65; 

  // 2. Determine Intensity Multiplier based on Goal
  let intensity = 0.70; // Default (Muscle Gain)
  if (formData.primary_goal === 'strength') intensity = 0.85;
  if (formData.primary_goal === 'endurance' || formData.primary_goal === 'fat_loss') intensity = 0.60;

  // 3. Retrieve User PRs OR Estimate from Body Weight (The "Smart Fallback")
  // If user entered a specific number, use it. If not, estimate based on BW * standard ratio.
  const benchPr = Number(formData.bench_press) || (bw * 0.75 * genderMod);
  const squatPr = Number(formData.squat) || (bw * 1.0 * genderMod);
  const deadliftPr = Number(formData.deadlift) || (bw * 1.2 * genderMod);
  const ohpPr = Number(formData.overhead_press) || (bw * 0.45 * genderMod);

  // 4. Logic Matching

  // --- MAIN COMPOUND LIFTS ---
  // Chest
  if (name.includes('bench press')) {
    // Dumbbells are harder than barbells, use ~35% of barbell max per hand
    if (equipment.includes('dumbbell')) return Math.round((benchPr * 0.35) * intensity); 
    return Math.round(benchPr * intensity);
  }
  
  // Legs (Squat patterns)
  if (name.includes('squat')) {
    // Goblet/Dumbbell squats are significantly lighter than Barbell Back Squats
    if (name.includes('goblet') || equipment.includes('dumbbell')) return Math.round((squatPr * 0.4) * intensity);
    return Math.round(squatPr * intensity);
  }
  
  // Back (Deadlift patterns)
  if (name.includes('deadlift')) return Math.round(deadliftPr * intensity);
  
  // Shoulders (Pressing)
  if (name.includes('overhead') || name.includes('military') || name.includes('shoulder press')) {
    if (equipment.includes('dumbbell')) return Math.round((ohpPr * 0.4) * intensity);
    return Math.round(ohpPr * intensity);
  }

  // --- ACCESSORY MOVEMENTS (Scaled off Estimates) ---
  
  // Back (Rows/Pulldowns) - Linked to Deadlift/BW strength (approx 20% of DL)
  if (name.includes('row') || name.includes('pulldown')) {
     return Math.round((deadliftPr * 0.20) * intensity); 
  }

  // Legs (Lunges/Step Ups) - Linked to Squat strength (approx 25% of Squat)
  if (name.includes('lunge') || name.includes('split squat') || name.includes('step up')) {
     return Math.round((squatPr * 0.25) * intensity); 
  }

  // Leg Press (Usually stronger than Squat, approx 1.5x)
  if (name.includes('leg press')) {
     return Math.round((squatPr * 1.5) * intensity);
  }

  // Arms (Biceps/Triceps) - Linked to OHP strength
  if (name.includes('curl') || name.includes('tricep') || name.includes('extension')) {
     return Math.round((ohpPr * 0.3) * intensity);
  }
  
  // Isolation (Flys / Lateral Raises) - Very light (approx 15% of OHP)
  if (name.includes('fly') || name.includes('raise') || name.includes('lateral')) {
     return Math.round((ohpPr * 0.15) * intensity);
  }

  // --- SAFETY NET DEFAULTS (Based on BW now) ---
  // Instead of static 10kg, use a tiny fraction of bodyweight (e.g. 15%)
  if (equipment.includes('dumbbell')) return Math.max(5, Math.round(bw * 0.15)); 
  if (equipment.includes('barbell')) return 20; // Empty bar default

  return 0; // Bodyweight only
}

// ==========================================
// 3. MAIN GENERATOR FUNCTION
// ==========================================

export async function generateAndSaveProgram(
  formData: OnboardingFormData,
  userId: string
) {
  console.log('📱 Mobile: Starting AI Program Generation...');
  
  // 1. Calculate Nutrition
  const nutrition = calculateNutritionPlan(formData);

  // 2. FETCH THE DATABASE (The "Menu" for the AI)
  let exerciseQuery = supabase
    .from('exercises')
    .select('id, name, equipment, primary_muscle');

  // LOGIC: If 'Home', filter strictly. If 'Gym', give access to EVERYTHING.
  if (formData.training_location === 'home') {
    const userEquipment = formData.available_equipment || [];
    const has = (keyword: string) => userEquipment.some(item => item.toLowerCase().includes(keyword));
    
    // Always allow bodyweight for home
    const allowedTypes = ['bodyweight'];
    if (has('dumbbell')) allowedTypes.push('dumbbell');
    if (has('barbell')) allowedTypes.push('barbell');
    if (has('band')) allowedTypes.push('cable'); 
    
    exerciseQuery = exerciseQuery.in('equipment', allowedTypes);
  } 

  const { data: availableExercises } = await exerciseQuery;

  if (!availableExercises || availableExercises.length === 0) {
    throw new Error("No exercises found. Please check your equipment settings.");
  }

  // 3. Generate Program via AI
  const program = await generateAIProgram(formData, availableExercises);

  // 4. SAVE METADATA TO DATABASE
  console.log('💾 Saving Metadata...');

  const { error: profileError } = await supabase
    .from('user_fitness_profiles')
    .upsert({
      user_id: userId,
      primary_goal: formData.primary_goal,
      experience_level: formData.training_experience,
      days_per_week: formData.available_days_per_week,
      session_duration: formData.session_duration,
      equipment: formData.available_equipment,
      injuries: formData.current_injuries,
      onboarding_completed: true
    });

  if (profileError) throw new Error(`Profile Save Failed: ${profileError.message}`);

  await supabase.from('nutrition_plans').insert({
    user_id: userId,
    calories: nutrition.daily_calories,
    protein: nutrition.macros.protein_grams,
    carbs: nutrition.macros.carbs_grams,
    fat: nutrition.macros.fat_grams,
    active: true
  });

  await supabase.from('ai_generated_programs').insert({
    user_id: userId,
    name: program.program_name,
    program_data: program,
    is_active: true
  });

  // ==========================================
  // 5. INSTANTIATE ACTIVE SESSIONS
  // ==========================================
  console.log('🏗️ Building Active Sessions...');
  
  const firstWeek = program.weeks[0];

  for (const workout of firstWeek.workouts) {
    const { data: session, error: sessionError } = await supabase
      .from('workout_sessions')
      .insert({
        user_id: userId,
        name: workout.workout_name,
        total_volume: 0
      })
      .select()
      .single();

    if (sessionError || !session) continue;

    for (const ex of workout.exercises) {
      
      // LOOKUP
      let dbExercise = availableExercises.find(e => 
        e.name.toLowerCase() === ex.exercise_name.toLowerCase()
      );

      if (!dbExercise) {
         const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
         dbExercise = availableExercises.find(e => 
            normalize(e.name).includes(normalize(ex.exercise_name)) || 
            normalize(ex.exercise_name).includes(normalize(e.name))
         );
      }

      if (dbExercise) {
        // ✅ CALCULATE SUGGESTED WEIGHT (Using new logic)
        const suggestedWeight = calculateLoad(dbExercise.name, dbExercise.equipment, formData);
        
        // ✅ USE AI REST TIME (OR DEFAULT)
        const restTime = ex.rest_seconds || 60;

        const targetSets = ex.sets || 3;
        const setRows = [];

        for (let i = 1; i <= targetSets; i++) {
          setRows.push({
            session_id: session.id,
            exercise_id: dbExercise.id,
            set_number: i,
            target_reps: parseInt(ex.reps) || 10,
            weight_kg: suggestedWeight, // Pre-filled weight
            rest_seconds: restTime // Saved to DB
          });
        }

        await supabase.from('set_logs').insert(setRows);
        
      } else {
        console.warn(`⚠️ SKIPPED: AI hallucinated "${ex.exercise_name}"`);
      }
    }
  }

  return { success: true };
}

// ==========================================
// 3. AI LOGIC
// ==========================================

async function generateAIProgram(formData: OnboardingFormData, dbList: any[]): Promise<WorkoutProgram> {
  const apiKey = process.env.EXPO_PUBLIC_GROQ_API_KEY;
  if (!apiKey) throw new Error('Missing API Key');

  const exerciseMenu = dbList.map(e => `"${e.name}"`).join(', ');
  const dayCount = formData.available_days_per_week || 3;
  const duration = formData.session_duration || 60;
  
  // Calculate target exercise count
  const targetExerciseCount = Math.max(4, Math.floor(duration / 9)); 

  // Rest Time Instructions based on Goal
  let restInstruction = "Rest 60-90s between sets.";
  if (formData.primary_goal === 'strength') restInstruction = "Rest 180-300s for compounds, 90s for accessories.";
  if (formData.primary_goal === 'fat_loss') restInstruction = "Rest 30-60s to keep heart rate up.";

  const prompt = `
    You are a professional fitness coach. I have given you access to my database of exercises below.
    
    DATABASE: [${exerciseMenu}]

    USER: ${formData.primary_goal} goal, ${formData.training_experience} level.
    SCHEDULE: ${dayCount} Days, ${duration} Mins/Session.
    
    INSTRUCTIONS:
    1. Create exactly ${dayCount} unique workouts.
    2. Each workout: ${targetExerciseCount}-${targetExerciseCount + 2} exercises.
    3. USE EXACT NAMES from the database.
    4. ${restInstruction}
    5. Return pure JSON.

    JSON STRUCTURE:
    {
      "program_name": "String",
      "program_overview": "String",
      "weeks": [
        {
          "week_number": 1,
          "workouts": [
            {
              "day": "Monday",
              "workout_name": "String",
              "exercises": [
                { "exercise_name": "Exact Name", "sets": 3, "reps": "10", "rest_seconds": 90 }
              ]
            }
          ]
        }
      ]
    }
  `;

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: 'You are a JSON generator.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.1,
        response_format: { type: 'json_object' }
      })
    });

    const data = await response.json();
    return JSON.parse(data.choices[0].message.content);
  } catch (e) {
    console.error("AI Error", e);
    throw new Error("AI Generation Failed");
  }
}