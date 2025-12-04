import { useLocalSearchParams, router, Stack } from 'expo-router';
import { View, ActivityIndicator, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import ExerciseLogger from '@/components/workout/ExerciseLogger';
import { X } from 'lucide-react-native';

export default function ActiveWorkoutScreen() {
  const { id } = useLocalSearchParams();
  const [workout, setWorkout] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) fetchWorkoutDetails();
  }, [id]);

  const fetchWorkoutDetails = async () => {
    try {
      // 1. Fetch Session Info
      const { data: sessionData, error: sessionError } = await supabase
        .from('workout_sessions')
        .select('*')
        .eq('id', id)
        .single();

      if (sessionError) throw sessionError;

      // 2. Fetch Logs + Exercise Names
      const { data: logsData, error: logsError } = await supabase
        .from('set_logs')
        .select(`*, exercises (name)`)
        .eq('session_id', id)
        .order('id', { ascending: true }); // Keep order

      if (logsError) throw logsError;

      // 3. TRANSFORM DATA: Group flat logs into Exercises
      const groupedExercises: any[] = [];
      const exerciseMap = new Map();

      logsData?.forEach((log) => {
        const exId = log.exercise_id;
        const exName = log.exercises?.name || 'Unknown Exercise';

        if (!exerciseMap.has(exId)) {
          const newGroup = {
            exercise_id: exId,
            exercise_name: exName,
            sets: []
          };
          exerciseMap.set(exId, newGroup);
          groupedExercises.push(newGroup);
        }

        exerciseMap.get(exId).sets.push({
          set_number: log.set_number,
          weight: log.weight, // ✅ This is the AI Calculated Weight
          target_reps: log.target_reps,
          rest_seconds: log.rest_seconds,
          completed: false, 
          log_id: log.id 
        });
      });

      setWorkout({
        id: sessionData.id,
        name: sessionData.name,
        exercises: groupedExercises
      });
      
    } catch (error) {
      console.error("Error fetching workout details:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#7c3aed" />
      </View>
    );
  }

  if (!workout) {
    return (
      <View className="flex-1 bg-white justify-center items-center">
        <Text>Workout not found.</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView className="flex-1" edges={['top']}>
        {/* Header */}
        <View className="px-4 py-2 border-b border-gray-100 flex-row justify-between items-center">
          <View>
            <Text className="text-xs text-gray-400 font-bold uppercase tracking-wider">Active Session</Text>
            <Text className="text-lg font-bold text-gray-900">{workout.name}</Text>
          </View>
          
          <TouchableOpacity onPress={() => router.back()} className="h-10 w-10 bg-gray-100 rounded-full items-center justify-center">
            <X size={20} color="black" />
          </TouchableOpacity>
        </View>

        {/* Logger Component */}
        <ExerciseLogger 
          sessionId={Array.isArray(id) ? id[0] : id} 
          exercises={workout.exercises} 
        />
      </SafeAreaView>
    </View>
  );
}