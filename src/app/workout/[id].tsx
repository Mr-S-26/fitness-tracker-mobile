import { useLocalSearchParams, router, Stack } from 'expo-router';
import { View, ActivityIndicator, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import ExerciseLogger from '@/components/workout/ExerciseLogger';
import { X } from 'lucide-react-native';

export default function ActiveWorkoutScreen() {
  const { id } = useLocalSearchParams(); // Get the workout ID from the URL
  const [workout, setWorkout] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWorkoutDetails();
  }, [id]);

  const fetchWorkoutDetails = async () => {
    try {
      // In a real app, you'd fetch from 'workouts' table. 
      // For now, we'll simulate a workout based on the ID or fetch a real one if you have data.
      
      // OPTION A: If you have data in Supabase, uncomment this:
      /*
      const { data, error } = await supabase
        .from('workouts')
        .select('*, workout_exercises(*, exercises(*))')
        .eq('id', id)
        .single();
      if (error) throw error;
      setWorkout(data);
      */

      // OPTION B: Dummy Data for Testing UI
      setWorkout({
        id: id,
        name: 'Upper Body Power',
        exercises: [
          {
            exercise_name: 'Bench Press',
            sets: [
              { set_number: 1, weight: 60, target_reps: 10, completed: false },
              { set_number: 2, weight: 62.5, target_reps: 8, completed: false },
              { set_number: 3, weight: 65, target_reps: 6, completed: false },
            ]
          },
          {
            exercise_name: 'Pull Ups',
            sets: [
              { set_number: 1, weight: 0, target_reps: 12, completed: false },
              { set_number: 2, weight: 0, target_reps: 12, completed: false },
            ]
          }
        ]
      });
      
    } catch (error) {
      console.error(error);
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

  return (
    <View className="flex-1 bg-white">
      {/* Hide the default header to use our custom one */}
      <Stack.Screen options={{ headerShown: false }} />
      
      <SafeAreaView className="flex-1" edges={['top']}>
        {/* Header */}
        <View className="px-4 py-2 border-b border-gray-100 flex-row justify-between items-center">
          <View>
            <Text className="text-xs text-gray-400 font-bold uppercase tracking-wider">Active Session</Text>
            <Text className="text-lg font-bold text-gray-900">{workout?.name}</Text>
          </View>
          
          <TouchableOpacity 
            onPress={() => router.back()}
            className="h-10 w-10 bg-gray-100 rounded-full items-center justify-center"
          >
            <X size={20} color="black" />
          </TouchableOpacity>
        </View>

        {/* The Logger Component you already built */}
        <ExerciseLogger 
          sessionId={typeof id === 'string' ? id : 'new-session'} 
          exercises={workout?.exercises} 
        />
      </SafeAreaView>
    </View>
  );
}