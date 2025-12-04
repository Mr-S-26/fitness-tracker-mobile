import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Play, Calendar, ChevronRight, Dumbbell } from 'lucide-react-native';
import { router } from 'expo-router';
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';

export default function WorkoutTab() {
  const [workouts, setWorkouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchWorkouts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // ✅ Fetch REAL sessions from the database
      const { data, error } = await supabase
        .from('workout_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true }); // Shows Day 1, Day 2...

      if (error) throw error;
      setWorkouts(data || []);
    } catch (error) {
      console.error("Error fetching workouts:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchWorkouts();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchWorkouts();
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-gray-50 p-4">
      <Text className="text-3xl font-bold text-gray-900 mb-6">Workouts</Text>

      {/* Quick Start Card (Defaults to the first available workout) */}
      {workouts.length > 0 && (
        <View className="bg-purple-600 rounded-3xl p-6 mb-8 shadow-lg shadow-purple-200">
          <View className="flex-row justify-between items-start mb-4">
            <View>
              <Text className="text-purple-100 font-medium mb-1">Up Next</Text>
              <Text className="text-2xl font-bold text-white">{workouts[0].name}</Text>
            </View>
            <View className="bg-purple-500/50 p-2 rounded-xl">
              <Calendar color="white" size={24} />
            </View>
          </View>

          <TouchableOpacity 
            onPress={() => router.push(`/workout/${workouts[0].id}`)}
            className="bg-white flex-row items-center justify-center py-4 rounded-xl"
          >
            <Play size={20} color="#7c3aed" fill="#7c3aed" />
            <Text className="text-purple-700 font-bold ml-2">Start Workout</Text>
          </TouchableOpacity>
        </View>
      )}

      <Text className="text-lg font-bold text-gray-900 mb-4">Your Schedule</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#7c3aed" />
      ) : (
        <ScrollView 
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {workouts.length === 0 ? (
            <View className="items-center py-10">
              <Text className="text-gray-400">No workouts found.</Text>
              <Text className="text-gray-400 text-sm">Try regenerating your plan.</Text>
            </View>
          ) : (
            workouts.map((workout, index) => (
              <TouchableOpacity 
                key={workout.id}
                onPress={() => router.push(`/workout/${workout.id}`)}
                className="bg-white p-4 rounded-2xl mb-3 flex-row items-center justify-between shadow-sm border border-gray-100"
              >
                <View className="flex-row items-center">
                  <View className="h-10 w-10 bg-gray-50 rounded-full items-center justify-center mr-4">
                    <Dumbbell size={20} color="#6b7280" />
                  </View>
                  <View>
                    <Text className="font-bold text-gray-900 text-lg">{workout.name}</Text>
                    <Text className="text-gray-500 text-sm">Session {index + 1}</Text>
                  </View>
                </View>
                <ChevronRight size={20} color="#9ca3af" />
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}