import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Target, TrendingUp, Zap, Trophy } from 'lucide-react-native';

export default function GoalsStep() {
  const params = useLocalSearchParams();
  const [goal, setGoal] = useState('general_fitness');
  const [experience, setExperience] = useState('beginner');

  const goals = [
    { id: 'muscle_gain', label: 'Build Muscle', icon: TrendingUp },
    { id: 'fat_loss', label: 'Lose Fat', icon: Zap },
    { id: 'strength', label: 'Get Stronger', icon: Trophy },
    { id: 'general_fitness', label: 'Stay Healthy', icon: Target },
  ];

  const levels = ['beginner', 'intermediate', 'advanced'];

  const handleNext = () => {
    router.push({
      pathname: '/onboarding/step3_strategy',
      params: { ...params, goal, experience }
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-white p-6 justify-between">
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text className="text-3xl font-bold text-gray-900 mb-2">What's your goal?</Text>
        <Text className="text-gray-500 mb-8">This helps us design your program.</Text>

        {/* Goal Grid */}
        <View className="flex-row flex-wrap gap-3 mb-8">
          {goals.map((g) => (
            <TouchableOpacity 
              key={g.id}
              onPress={() => setGoal(g.id)}
              className={`w-[48%] p-4 rounded-2xl border-2 ${
                goal === g.id ? 'border-purple-600 bg-purple-50' : 'border-gray-200 bg-white'
              }`}
            >
              <g.icon size={24} color={goal === g.id ? '#7c3aed' : '#9ca3af'} />
              <Text className={`font-bold mt-2 ${goal === g.id ? 'text-purple-900' : 'text-gray-600'}`}>
                {g.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Experience Slider (Simple) */}
        <Text className="text-xl font-bold text-gray-900 mb-4">Training Experience</Text>
        <View className="bg-gray-100 p-1 rounded-xl flex-row">
          {levels.map((l) => (
            <TouchableOpacity 
              key={l}
              onPress={() => setExperience(l)}
              className={`flex-1 py-3 rounded-lg items-center ${
                experience === l ? 'bg-white shadow-sm' : ''
              }`}
            >
              <Text className={`font-bold capitalize ${experience === l ? 'text-gray-900' : 'text-gray-400'}`}>
                {l}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <TouchableOpacity onPress={handleNext} className="bg-purple-600 py-4 rounded-2xl items-center mt-4">
        <Text className="text-white font-bold text-lg">Next Step →</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}