import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { supabase } from '@/lib/supabase/client';
// import { generateAndSaveProgram } from '@/lib/ai/onboarding/program-generator'; // Keeping your import
import { Bot } from 'lucide-react-native';

export default function GeneratingScreen() {
  const params = useLocalSearchParams();
  const [status, setStatus] = useState('Initializing...');

  useEffect(() => {
    const runGeneration = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("No user found");

        setStatus('Saving your profile...');
        
        // --- 1. PARSE DATA ---
        const daysArray = params.available_days ? JSON.parse(params.available_days as string) : [];
        const equipmentArray = params.equipment ? JSON.parse(params.equipment as string) : [];
        const focusArray = params.focus_areas ? JSON.parse(params.focus_areas as string) : [];
        const injuriesArray = params.current_injuries ? JSON.parse(params.current_injuries as string) : [];

        // --- 2. ORGANIZE STRENGTH STATS ---
        // We group all the loose PR fields into one JSON object
        const strengthStats: Record<string, any> = {};
        
        if (params.strength_type === 'weighted') {
            if (params.bench_press) strengthStats.bench_press = Number(params.bench_press);
            if (params.squat) strengthStats.squat = Number(params.squat);
            if (params.deadlift) strengthStats.deadlift = Number(params.deadlift);
            if (params.overhead_press) strengthStats.overhead_press = Number(params.overhead_press);
            if (params.max_weighted_pullup) strengthStats.weighted_pullup = Number(params.max_weighted_pullup);
        } else {
            if (params.max_pushups) strengthStats.pushups = Number(params.max_pushups);
            if (params.max_pullups) strengthStats.pullups = Number(params.max_pullups);
            if (params.max_squat_reps) strengthStats.squat_reps = Number(params.max_squat_reps);
            if (params.max_plank) strengthStats.plank_sec = Number(params.max_plank);
        }

        // --- 3. SAVE TO DATABASE ---
        // We do a "UPSERT" (Update if exists, Insert if new) based on user_id
        const { error: dbError } = await supabase
          .from('user_fitness_profiles')
          .upsert({
            user_id: user.id,
            
            // Bio
            age: Number(params.age),
            gender: params.gender,
            height_cm: Number(params.height),
            weight_kg: Number(params.weight),
            
            // Goals
            primary_goal: params.goal,
            experience_level: params.experience, // Ensure DB column is experience_level or experience
            
            // Strategy
            focus_areas: focusArray,
            strength_type: params.strength_type,
            strength_stats: strengthStats, // ✅ Saved as JSONB
            
            // Logistics
            days_per_week: daysArray.length,
            selected_days: daysArray,
            session_duration: Number(params.session_duration),
            training_location: params.training_location,
            preferred_workout_time: params.preferred_time,
            equipment: equipmentArray,
            
            // Safety
            injuries: injuriesArray,
            
            onboarding_completed: true,
            updated_at: new Date().toISOString(),
          });

        if (dbError) throw dbError;

        // --- 4. GENERATE AI PROGRAM ---
        setStatus('AI is designing your workouts...');
        
        // Pass the cleaned data to your generator function if needed
        // await generateAndSaveProgram(user.id); 

        setStatus('Finalizing...');
        setTimeout(() => {
          router.replace('/(tabs)/dashboard');
        }, 1500);

      } catch (error) {
        console.error("Generation Failed:", error);
        setStatus('Error saving data. Please try again.');
      }
    };

    runGeneration();
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-white justify-center items-center p-8">
      <View className="bg-purple-100 p-6 rounded-full mb-8">
        <Bot size={64} color="#7c3aed" />
      </View>
      <Text className="text-2xl font-bold text-gray-900 text-center mb-4">
        Building Your Plan
      </Text>
      <Text className="text-gray-500 text-center mb-8">{status}</Text>
      <ActivityIndicator size="large" color="#7c3aed" />
    </SafeAreaView>
  );
}