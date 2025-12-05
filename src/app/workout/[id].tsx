import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { supabase } from '@/lib/supabase/client';
import ExerciseLogger from '@/components/workout/ExerciseLogger';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function WorkoutDetailScreen() {
  const { id } = useLocalSearchParams();
  const [session, setSession] = useState<any>(null);
  const [exercises, setExercises] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) fetchSessionDetails();
  }, [id]);

  const fetchSessionDetails = async () => {
    try {
      // 1. Fetch Session Info
      const { data: sessionData, error: sessionError } = await supabase
        .from('workout_sessions')
        .select('*')
        .eq('id', id)
        .single();

      if (sessionError) throw sessionError;
      setSession(sessionData);

      // 2. Fetch Sets and join with Exercise details
      const { data: setsData, error: setsError } = await supabase
        .from('set_logs')
        .select(`
          *,
          exercises (
            name,
            primary_muscle,
            form_guide,      
            warm_up_guide,   
            cool_down_guide 
          )
        `)
        .eq('session_id', id)
        .order('created_at', { ascending: true });

      if (setsError) throw setsError;

      // 3. Group flat sets into Exercises
      const groupedExercises = groupSetsByExercise(setsData);
      setExercises(groupedExercises);

    } catch (error) {
      console.error("Error fetching workout details:", error);
    } finally {
      setLoading(false);
    }
  };

  const groupSetsByExercise = (sets: any[]) => {
    const groups: any[] = [];
    
    sets.forEach((set) => {
      const exerciseId = set.exercise_id;
      const exerciseName = set.exercises?.name || "Unknown Exercise";

      let group = groups.find(g => g.exercise_id === exerciseId);
      
      if (!group) {
        group = {
          exercise_id: exerciseId,
          exercise_name: exerciseName,
          // ✅ Pass the AI guides to the UI
          form_guide: set.exercises?.form_guide,
          warm_up_guide: set.exercises?.warm_up_guide,
          cool_down_guide: set.exercises?.cool_down_guide,
          sets: []
        };
        groups.push(group);
      }

      group.sets.push({
        log_id: set.id,
        set_number: set.set_number,
        target_reps: set.target_reps,
        weight: set.weight_kg,
        rest_seconds: set.rest_seconds,
        completed: !!set.completed_at,
      });
    });

    return groups;
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#7c3aed" />
      </SafeAreaView>
    );
  }

  if (!session) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-white">
        <Text className="text-gray-500">Workout not found.</Text>
      </SafeAreaView>
    );
  }

  // ✅ NEW SAFETY CHECK: Handle empty workouts
  if (exercises.length === 0) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-white p-6">
        <Text className="text-xl font-bold text-gray-900 mb-2">Empty Workout</Text>
        <Text className="text-gray-500 text-center">
          This session has no exercises logged. You might need to regenerate your plan.
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: session.name || 'Workout', headerBackTitle: 'Back' }} />
      <ExerciseLogger 
        sessionId={id} 
        exercises={exercises} 
        sessionWarmup={session.warmup_guide}   // <--- Passed correctly
        sessionCooldown={session.cooldown_guide} // <--- Passed correctly
      />
    </>
  );
}