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
      warmup: string;   // ✅ Correct: At Workout Level
      cooldown: string; // ✅ Correct: At Workout Level
      exercises: Array<{
        exercise_name: string;
        sets: number;
        reps: string;
        rest_seconds: number;
        notes?: string;
        form_tip?: string; // ✅ Correct: At Exercise Level
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
  const bw = Number(formData.weight_kg) || 70; 
  const isMale = formData.sex === 'male';
  const genderMod = isMale ? 1.0 : 0.65; 

  // 2. Determine Intensity Multiplier based on Goal
  let intensity = 0.70; // Default (Muscle Gain)
  if (formData.primary_goal === 'strength') intensity = 0.85;
  if (formData.primary_goal === 'endurance' || formData.primary_goal === 'fat_loss') intensity = 0.60;

  // 3. Retrieve User PRs OR Estimate from Body Weight
  const benchPr = Number(formData.bench_press) || (bw * 0.75 * genderMod);
  const squatPr = Number(formData.squat) || (bw * 1.0 * genderMod);
  const deadliftPr = Number(formData.deadlift) || (bw * 1.2 * genderMod);
  const ohpPr = Number(formData.overhead_press) || (bw * 0.45 * genderMod);

  // 4. Logic Matching
  if (name.includes('bench press')) {
    if (equipment.includes('dumbbell')) return Math.round((benchPr * 0.35) * intensity); 
    return Math.round(benchPr * intensity);
  }
  
  if (name.includes('squat')) {
    if (name.includes('goblet') || equipment.includes('dumbbell')) return Math.round((squatPr * 0.4) * intensity);
    return Math.round(squatPr * intensity);
  }
  
  if (name.includes('deadlift')) return Math.round(deadliftPr * intensity);
  
  if (name.includes('overhead') || name.includes('military') || name.includes('shoulder press')) {
    if (equipment.includes('dumbbell')) return Math.round((ohpPr * 0.4) * intensity);
    return Math.round(ohpPr * intensity);
  }

  if (name.includes('row') || name.includes('pulldown')) return Math.round((deadliftPr * 0.20) * intensity); 
  if (name.includes('lunge') || name.includes('split squat') || name.includes('step up')) return Math.round((squatPr * 0.25) * intensity); 
  if (name.includes('leg press')) return Math.round((squatPr * 1.5) * intensity);
  if (name.includes('curl') || name.includes('tricep') || name.includes('extension')) return Math.round((ohpPr * 0.3) * intensity);
  if (name.includes('fly') || name.includes('raise') || name.includes('lateral')) return Math.round((ohpPr * 0.15) * intensity);

  if (equipment.includes('dumbbell')) return Math.max(5, Math.round(bw * 0.15)); 
  if (equipment.includes('barbell')) return 20; 

  return 0; // Bodyweight
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

  // 2. FETCH THE DATABASE
  let exerciseQuery = supabase
    .from('exercises')
    .select('id, name, equipment, primary_muscle, movement_type, body_region'); 

  if (formData.training_location === 'home') {
    const userEquipment = formData.available_equipment || [];
    const has = (keyword: string) => userEquipment.some(item => item.toLowerCase().includes(keyword));
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

  // 4. SAVE METADATA
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
    }, { onConflict: 'user_id' });

  if (profileError) throw new Error(`Profile Save Failed: ${profileError.message}`);

  await supabase.from('nutrition_plans').update({ active: false }).eq('user_id', userId);
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
    // ✅ CORRECT: Save Warmup/Cooldown to the SESSION table
    const { data: session, error: sessionError } = await supabase
      .from('workout_sessions')
      .insert({
        user_id: userId,
        name: workout.workout_name,
        total_volume: 0,
        warmup_guide: workout.warmup,   
        cooldown_guide: workout.cooldown 
      })
      .select()
      .single();

    if (sessionError || !session) continue;

    for (const ex of workout.exercises) {
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
        // ✅ CORRECT: Save Form Tip to EXERCISES table
        if (ex.form_tip) {
          await supabase.from('exercises').update({
            form_guide: ex.form_tip
          }).eq('id', dbExercise.id);
        }

        const suggestedWeight = calculateLoad(dbExercise.name, dbExercise.equipment, formData);
        const restTime = ex.rest_seconds || 60;
        const targetSets = ex.sets || 3;
        const setRows = [];

        for (let i = 1; i <= targetSets; i++) {
          setRows.push({
            session_id: session.id,
            exercise_id: dbExercise.id,
            set_number: i,
            target_reps: parseInt(ex.reps) || 10,
            weight_kg: suggestedWeight,
            rest_seconds: restTime 
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

  const dayCount = formData.available_days_per_week || 3;
  const duration = formData.session_duration || 60;
  const targetExerciseCount = Math.max(4, Math.floor(duration / 9)); 

  // Check Bench
  const userEquipment = formData.available_equipment || [];
  const hasBench = userEquipment.some(e => e.toLowerCase().includes('bench'));
  
  let benchRule = "";
  if (!hasBench) {
    benchRule = `
    CRITICAL EQUIPMENT WARNING: 
    The user DOES NOT have a bench. 
    1. You MUST NOT select exercises with "Bench", "Incline", or "Decline" in the name.
    2. Instead, choose "Floor" variations or Standing variations.
    `;
  }

  const prompt = `
You are an expert fitness coach. You have access to the user’s exercise database below.
Each exercise includes 'movement_type' (push/pull/legs) and 'body_region' (upper/lower).

DATABASE (USE EXACT NAMES ONLY):
${JSON.stringify(dbList)}

USER PROFILE:
- Goal: ${formData.primary_goal}
- Schedule: ${dayCount} days/week
- Session Duration: ${duration} minutes
- Equipment Available: ${JSON.stringify(userEquipment)}

${benchRule}

===========================
REQUIRED SPLIT RULES
===========================
Use the EXACT split based on the user's training frequency:

If 5 Days/Week → ["Upper", "Lower", "Push", "Pull", "Legs"]
If 4 Days/Week → ["Upper", "Lower", "Upper", "Lower"]
If 3 Days/Week → ["Push", "Pull", "Legs"]
If 2 Days/Week → ["Full Body A", "Full Body B"]

Assign workouts in EXACT order of this split.

===========================
EXERCISE SELECTION RULES
===========================
1. Only choose exercises from the DATABASE provided.
2. NEVER create or rename exercises.
3. Each exercise must match the movement_type and/or body_region required by the workout split.
4. Only select exercises the user can perform with their available equipment.
5. Ensure exercise variety across the program.

===========================
SETS / REPS / REST RULES
===========================
You must dynamically determine sets, reps, and rest for EACH EXERCISE based on BOTH:
1. The user's primary goal, and
2. The user's session duration (in minutes).

GOAL-BASED RULES:
- Muscle Gain:
    sets: 3–4
    reps: 8–12
    rest_seconds: 60–120
- Fat Loss:
    sets: 2–3
    reps: 10–15
    rest_seconds: 45–75
- Strength:
    sets: 4–5
    reps: 4–6
    rest_seconds: 120–180
- General Fitness:
    sets: 2–3
    reps: 8–15
    rest_seconds: 45–90

SESSION DURATION ADJUSTMENTS:
- If ${duration} < 30 minutes:
    Use the LOWEST set count and LOWEST rest time in the goal’s range.
- If 30–45 minutes:
    Use MID-RANGE sets and rest.
- If > 45 minutes:
    Use the UPPER end of the goal’s set and rest ranges.

For each exercise:
- sets must follow the goal rules + duration adjustments.
- reps must follow the goal rules.
- rest_seconds must follow the goal rules + duration adjustments.

===========================
PROGRAM CREATION RULES
===========================
1. Create exactly ${dayCount} unique workouts.
2. Each workout must contain ${targetExerciseCount}-${targetExerciseCount + 2} exercises.
3. Use EXACT exercise names from the database.
4. For each workout, include:
   - warmup: specific to the workout’s muscle groups.
   - cooldown: specific to the workout’s muscle groups.
5. For each exercise, include:
   - sets (dynamic)
   - reps (dynamic)
   - rest_seconds (dynamic)
   - form_tip: max 10 words.

===========================
OUTPUT FORMAT (STRICT)
===========================
Output ONLY valid JSON. No explanations, no markdown, no text outside the JSON.

{
  "program_name": "String",
  "program_overview": "String",
  "weeks": [
    {
      "week_number": 1,
      "workouts": [
        {
          "day": "String",
          "workout_name": "String",
          "warmup": "String",
          "cooldown": "String",
          "exercises": [
            {
              "exercise_name": "String (MUST match database)",
              "sets": Number,
              "reps": "String",
              "rest_seconds": Number,
              "form_tip": "String"
            }
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