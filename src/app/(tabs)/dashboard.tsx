import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Dumbbell, Flame, Calendar, ChevronRight } from 'lucide-react-native';
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { router } from 'expo-router';

export default function DashboardScreen() {
  const [nextWorkout, setNextWorkout] = useState<any>(null);
  const [stats, setStats] = useState({ completed: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userName, setUserName] = useState('Athlete');

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Get User Profile (for name)
      const { data: profile } = await supabase
        .from('user_profiles') // Adjust if your table name differs, or remove if you don't store names
        .select('full_name')
        .eq('id', user.id)
        .single();
      
      if (profile?.full_name) setUserName(profile.full_name.split(' ')[0]);

      // 2. Get Next Workout (First incomplete session)
      const { data: nextSession, error: sessionError } = await supabase
        .from('workout_sessions')
        .select('*')
        .eq('user_id', user.id)
        .is('completed_at', null) // Only unfinished workouts
        .order('created_at', { ascending: true }) // Oldest first
        .limit(1)
        .single();

      if (!sessionError && nextSession) {
        setNextWorkout(nextSession);
      } else {
        setNextWorkout(null);
      }

      // 3. Get Stats (Count completed vs total)
      const { count: completedCount } = await supabase
        .from('workout_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .not('completed_at', 'is', null);

      const { count: totalCount } = await supabase
        .from('workout_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      setStats({ 
        completed: completedCount || 0, 
        total: totalCount || 0 
      });

    } catch (error) {
      console.error("Dashboard Fetch Error:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-900">
      <ScrollView 
        className="p-4"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Header */}
        <View className="mb-6">
          <Text className="text-3xl font-bold text-gray-900 dark:text-white">
            Hello, {userName} 👋
          </Text>
          <Text className="text-gray-500">Let's crush today's workout.</Text>
        </View>

        {/* Stats Row */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-6">
          <StatCard icon={Flame} label="Calories" value="2,100" color="orange" />
          <StatCard 
            icon={Dumbbell} 
            label="Workouts" 
            value={`${stats.completed}/${stats.total}`} 
            color="blue" 
          />
          <StatCard icon={Calendar} label="Streak" value="1" color="green" />
        </ScrollView>

        {/* Today's Workout Card */}
        {loading ? (
          <ActivityIndicator size="large" color="#7c3aed" />
        ) : nextWorkout ? (
          <View className="bg-white p-6 rounded-3xl shadow-sm mb-4 border border-gray-100">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-xl font-bold text-gray-800">Next Session</Text>
              <View className="bg-purple-100 px-3 py-1 rounded-full">
                 <Text className="text-purple-700 font-bold text-xs">READY</Text>
              </View>
            </View>
            
            <Text className="text-3xl font-black text-purple-600 mb-2">
              {nextWorkout.name}
            </Text>
            {/* You can add real duration if you save it to the session, otherwise estimate */}
            <Text className="text-gray-500 mb-6">Estimated: 45-60 Min</Text>

            <TouchableOpacity 
              onPress={() => router.push(`/workout/${nextWorkout.id}`)}
              className="bg-gray-900 py-4 rounded-2xl items-center flex-row justify-center"
            >
              <Text className="text-white font-bold text-lg mr-2">Start Workout</Text>
              <ChevronRight size={20} color="white" />
            </TouchableOpacity>
          </View>
        ) : (
          <View className="bg-white p-6 rounded-3xl shadow-sm mb-4 items-center border border-gray-100">
            <Text className="text-xl font-bold text-gray-400 mb-2">No Active Plan</Text>
            <Text className="text-gray-400 text-center mb-4">
              You've completed everything! Generate a new program to keep going.
            </Text>
            <TouchableOpacity 
              onPress={() => router.push('/onboarding/step1_bio')}
              className="bg-purple-100 px-6 py-3 rounded-xl"
            >
              <Text className="text-purple-700 font-bold">Create New Plan</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// Simple Component for Stats
function StatCard({ icon: Icon, label, value, color }: any) {
  return (
    <View className="bg-white p-4 rounded-2xl mr-3 w-32 shadow-sm border border-gray-100">
      <Icon size={24} color={color} />
      <Text className="text-gray-500 mt-2 text-xs">{label}</Text>
      <Text className="text-xl font-bold text-gray-900">{value}</Text>
    </View>
  );
}