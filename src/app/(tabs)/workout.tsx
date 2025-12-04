import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Play, Calendar, ChevronRight } from 'lucide-react-native';
import { router } from 'expo-router';

export default function WorkoutTab() {
  const workouts = [
    { id: '1', name: 'Upper Body Power', duration: '45 min', focus: 'Strength' },
    { id: '2', name: 'Lower Body Hypertrophy', duration: '60 min', focus: 'Muscle' },
    { id: '3', name: 'Full Body Tempo', duration: '50 min', focus: 'Endurance' },
  ];

  return (
    <SafeAreaView className="flex-1 bg-gray-50 p-4">
      <Text className="text-3xl font-bold text-gray-900 mb-6">Workouts</Text>

      {/* Quick Start Card */}
      <View className="bg-purple-600 rounded-3xl p-6 mb-8 shadow-lg shadow-purple-200">
        <View className="flex-row justify-between items-start mb-4">
          <View>
            <Text className="text-purple-100 font-medium mb-1">Today's Plan</Text>
            <Text className="text-2xl font-bold text-white">Upper Body Power</Text>
          </View>
          <View className="bg-purple-500/50 p-2 rounded-xl">
            <Calendar color="white" size={24} />
          </View>
        </View>

        <TouchableOpacity 
          onPress={() => router.push('/workout/1')}
          className="bg-white flex-row items-center justify-center py-4 rounded-xl"
        >
          <Play size={20} color="#7c3aed" fill="#7c3aed" />
          <Text className="text-purple-700 font-bold ml-2">Start Workout</Text>
        </TouchableOpacity>
      </View>

      <Text className="text-lg font-bold text-gray-900 mb-4">Your Library</Text>

      <ScrollView showsVerticalScrollIndicator={false}>
        {workouts.map((workout) => (
          <TouchableOpacity 
            key={workout.id}
            onPress={() => router.push(`/workout/${workout.id}`)}
            className="bg-white p-4 rounded-2xl mb-3 flex-row items-center justify-between shadow-sm border border-gray-100"
          >
            <View>
              <Text className="font-bold text-gray-900 text-lg">{workout.name}</Text>
              <Text className="text-gray-500 text-sm">{workout.duration} • {workout.focus}</Text>
            </View>
            <ChevronRight size={20} color="#9ca3af" />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}