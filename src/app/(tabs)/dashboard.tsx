import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Dumbbell, Flame, Calendar } from 'lucide-react-native';

export default function DashboardScreen() {
  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-900">
      <ScrollView className="p-4">
        {/* Header */}
        <View className="mb-6">
          <Text className="text-3xl font-bold text-gray-900 dark:text-white">
            Hello, Athlete 👋
          </Text>
          <Text className="text-gray-500">Let's crush today's workout.</Text>
        </View>

        {/* Stats Row (Horizontal Scroll) */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-6">
          <StatCard icon={Flame} label="Calories" value="2,100" color="orange" />
          <StatCard icon={Dumbbell} label="Workouts" value="3/5" color="blue" />
          <StatCard icon={Calendar} label="Streak" value="12" color="green" />
        </ScrollView>

        {/* Today's Workout Card */}
        <View className="bg-white p-6 rounded-3xl shadow-sm mb-4">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-xl font-bold">Today's Session</Text>
            <View className="bg-purple-100 px-3 py-1 rounded-full">
               <Text className="text-purple-700 font-bold text-xs">READY</Text>
            </View>
          </View>
          
          <Text className="text-3xl font-black text-purple-600 mb-2">Upper Power</Text>
          <Text className="text-gray-500 mb-6">45 Min • 6 Exercises</Text>

          <TouchableOpacity className="bg-gray-900 py-4 rounded-2xl items-center">
            <Text className="text-white font-bold text-lg">Start Workout</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// Simple Component for Stats
function StatCard({ icon: Icon, label, value, color }: any) {
  return (
    <View className="bg-white p-4 rounded-2xl mr-3 w-32 shadow-sm">
      <Icon size={24} color={color} />
      <Text className="text-gray-500 mt-2 text-xs">{label}</Text>
      <Text className="text-xl font-bold">{value}</Text>
    </View>
  );
}