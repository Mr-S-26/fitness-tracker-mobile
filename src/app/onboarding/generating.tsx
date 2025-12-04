import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { supabase } from '@/lib/supabase/client';
import { generateAndSaveProgram } from '@/lib/ai/onboarding/program-generator';
import { Bot } from 'lucide-react-native';

export default function GeneratingScreen() {
  const params = useLocalSearchParams();
  const [status, setStatus] = useState('Initializing...');

  useEffect(() => {
    const runGeneration = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("No user found");

        setStatus('Analyzing your profile...');
        
        // 1. Correctly parse the days array
        const daysArray = params.available_days ? JSON.parse(params.available_days as string) : [];
        const daysCount = daysArray.length > 0 ? daysArray.length : 3;

        const formData: any = {
          ...params,
          available_equipment: params.equipment ? JSON.parse(params.equipment as string) : [],
          current_injuries: params.current_injuries ? JSON.parse(params.current_injuries as string) : [],
          focus_areas: params.focus_areas ? JSON.parse(params.focus_areas as string) : [],
          
          // ✅ FIX: Use the length of the array, not Number() on the string
          available_days_per_week: daysCount,
          selected_days: daysArray, // Pass the specific days too (e.g. Mon, Wed)

          age: Number(params.age),
          weight_kg: Number(params.weight),
          height_cm: Number(params.height),
          session_duration: Number(params.session_duration) || 60, // Ensure duration is passed
          primary_goal: params.goal,
          training_experience: params.experience,
        };

        setStatus('AI is writing your workout plan...');
        await generateAndSaveProgram(formData, user.id);

        setStatus('Finalizing setup...');
        setTimeout(() => {
          router.replace('/(tabs)/dashboard');
        }, 1000);

      } catch (error) {
        console.error("Generation Failed:", error);
        setStatus('Error generating plan. Please try again.');
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